import asyncio
import io
import re
from concurrent.futures import ThreadPoolExecutor
from functools import partial

import torch
from fastapi import HTTPException, UploadFile, status
from peft import PeftModel
from PIL import Image
from transformers import Gemma3ForConditionalGeneration, Gemma3Processor

from app.core.config import config
from app.core.logging import get_logger
from app.core.paths import CONFIG_DIR
from app.core.settings import settings
from app.utils.yaml_parser import load_yaml

logger = get_logger(__name__)

_thread_pool = ThreadPoolExecutor(max_workers=2)

ACR_DENSITY_MAP = {"A": 1, "B": 2, "C": 3, "D": 4}
BIRADS_K = 2


class ReportService:
    _model = None
    _processor = None

    @classmethod
    def load_model(cls, retries: int | None = None) -> None:
        if retries is None:
            retries = config.model_load_retries

        last_exception: Exception | None = None
        for attempt in range(1, retries + 1):
            try:
                logger.info(
                    "Loading model '%s' (attempt %d/%d)...",
                    settings.image_text_to_text_model,
                    attempt,
                    retries,
                )

                base_model = Gemma3ForConditionalGeneration.from_pretrained(
                    settings.image_text_to_text_model, dtype=torch.float16, device_map="auto"
                ).eval()
                cls._model = PeftModel.from_pretrained(
                    base_model, settings.image_text_to_text_model
                )

                cls._device = next(cls._model.parameters()).device
                logger.info("Model device resolved to '%s'.", cls._device)

                cls._processor = Gemma3Processor.from_pretrained(
                    settings.image_text_to_text_model, use_fast=True
                )

                logger.info("Model loaded successfully.")
                return

            except Exception as exc:
                last_exception = exc
                logger.warning("Model load attempt %d/%d failed: %s", attempt, retries, exc)

        raise RuntimeError(f"Failed to load model after {retries} attempts: {last_exception}")

    @classmethod
    def unload_model(cls) -> None:
        cls._model = None
        cls._processor = None

        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        logger.info("Model unloaded.")

    @classmethod
    def _run_inference(cls, image: UploadFile, notes: str | None) -> str:
        if cls._model is None or cls._processor is None:
            raise RuntimeError(
                "Model is not loaded. Ensure the application startup completed successfully."
            )

        prompts = load_yaml(CONFIG_DIR / "prompts.yaml")
        mammography_prompts = prompts["mammography_analysis"]

        system_text = mammography_prompts["system"].strip()
        user_text = mammography_prompts["user_instruction"].strip()
        if notes:
            user_text += f"\n\nAdditional clinical notes: {notes}"

        messages = [
            {
                "role": "system",
                "content": [{"type": "text", "text": system_text}],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "image": Image.open(io.BytesIO(image.file.read())).convert("RGB"),
                    },
                    {"type": "text", "text": user_text},
                ],
            },
        ]

        device = next(cls._model.parameters()).device

        inputs = cls._processor.apply_chat_template(
            messages,
            tokenize=True,  # pyright: ignore[reportCallIssue]
            return_dict=True,  # pyright: ignore[reportCallIssue]
            return_tensors="pt",  # pyright: ignore[reportCallIssue]
            add_generation_prompt=True,  # pyright: ignore[reportCallIssue]
        ).to(device)

        input_len = inputs["input_ids"].shape[-1]

        with torch.inference_mode():
            outputs = cls._model.generate(
                **inputs,
                max_new_tokens=1024,
                do_sample=False,
                pad_token_id=cls._processor.tokenizer.pad_token_id  # pyright: ignore[reportAttributeAccessIssue]
                or cls._processor.tokenizer.eos_token_id,  # pyright: ignore[reportAttributeAccessIssue]
            )

        generated_tokens = outputs[0][input_len:]
        report_text: str = cls._processor.decode(generated_tokens, skip_special_tokens=True)

        return report_text.strip()

    @classmethod
    def _calculate_urgency_score(cls, birads_list: list[int], acr: str | None) -> int | None:
        if not birads_list:
            return

        return sum(b**BIRADS_K for b in birads_list) - (
            ACR_DENSITY_MAP.get(acr, 0) if acr else 0
        )

    @classmethod
    def _extract_report_info(cls, text: str) -> dict[str, int | str | list | None]:
        acr_score = None
        acr_match = re.search(r"\bACR\s+([A-Da-d])\b", text, re.IGNORECASE)
        if acr_match:
            acr_score = acr_match.group(1).upper()

        birads_list: list[int] = []
        birads_match = re.search(r"\bBI-?RADS[:\s]+([\d\s,and]+)", text, re.IGNORECASE)
        if birads_match:
            birads_list = [int(x) for x in re.findall(r"[0-6]", birads_match.group(1))]

        findings = None
        findings_match = re.search(
            r"Findings\s*:\s*(.*?)(?=\n[A-Z][^\n]*:|$)", text, re.IGNORECASE | re.DOTALL
        )
        if findings_match:
            raw = findings_match.group(1).strip()
            lines = [line.strip() for line in raw.splitlines() if line.strip()]
            findings = " ".join(lines)

        return {
            "report": findings,
            "urgency_score": cls._calculate_urgency_score(birads_list, acr_score),
        }

    @classmethod
    async def generate_report(cls, image: UploadFile, notes: str | None) -> dict:
        loop = asyncio.get_running_loop()

        try:
            report = await asyncio.wait_for(
                loop.run_in_executor(_thread_pool, partial(cls._run_inference, image, notes)),
                timeout=config.model_timeout_seconds,
            )

        except asyncio.TimeoutError:
            logger.error(
                "Report generation timed out after %d seconds.", config.model_timeout_seconds
            )
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Report generation timed out. The model took too long to respond. Please try again later.",
            )

        except RuntimeError as exc:
            logger.error("Runtime error during report generation: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(exc),
            )

        except Exception as exc:
            logger.exception("Unexpected error during report generation: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred while generating the report.",
            )

        return cls._extract_report_info(report)
