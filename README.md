# AutoMammo

**Density & BI-RADS–Aware Triage and Report Generation (DB-ATRG)**

Research code for fine-tuning [MedGemma 1.5 4B-it](https://ai.google.dev/gemma/docs/medgemma)
to generate structured mammography reports from a single 2D view, and to estimate the two
biomarkers that drive urgency triage — **ACR breast density** and **BI-RADS category**.

> **Scope.** This repository is the experimentation pipeline only. The FastAPI inference
> server and React worklist UI that previously lived here have been removed; what remains is
> the notebook chain that builds the dataset, fine-tunes the model, and evaluates it.

---

## Motivation

Screening mammography is typically read First-In, First-Out. That ordering ignores diagnostic
complexity: in dense breast tissue, lesions can be obscured by overlying fibroglandular tissue
("masking bias"), so the cases most at risk of a missed or delayed diagnosis are not the ones
read first.

DB-ATRG estimates density and severity *before* formal radiologist review, and uses them to
reorder the worklist:

- **Phase I — density flagging.** Examinations classified **ACR D** (extremely dense) are
  flagged for supplemental screening and complexity-aware review.
- **Phase II — urgency ranking.** Remaining cases are ordered by a cumulative urgency score

  $$S = \sum_{i=1}^{N} (B_i)^k - D$$

  where $B_i$ is the BI-RADS category of each finding, $N$ the number of abnormalities, $k$ an
  exponential weight (default 2), and $D$ the ACR density value (A=1, B=2, C=3). Higher $S$
  means higher clinical priority.

The full rationale, impact case, and published evaluation are in [`writeup.md`](writeup.md).

## Repository layout

```text
auto-mammo/
├── config/
│   └── prompts-cot-zeroshot.yaml      # `zero_shot` is the prompt used for training + eval
├── notebooks/
│   ├── medgemma-image-processing.ipynb    # 1. DMID .tif → breast-cropped .png
│   ├── medgemma-report-processing.ipynb   # 2. DMID + VinDr reports → one canonical template
│   ├── medgemma-split.ipynb               # 3. Stratified train/val/test DatasetDict
│   ├── medgemma-train-eval.ipynb          # 4. QLoRA fine-tune + held-out evaluation
│   └── medgemma-analysis.ipynb            # 5. Confusion matrices, calibration, figures
├── README.md
└── writeup.md
```

## The pipeline

Run the notebooks in order. Each writes its output to Google Drive for the next to pick up.

| # | Notebook | Runtime | In → Out |
| --- | --- | --- | --- |
| 1 | `medgemma-image-processing` | CPU | DMID `.tif` → `.png`: 5-px border crop, intensity rescale to 8-bit, breast-region crop, resize to 912×1520. VinDr uses the released Mammo-CLIP PNGs and skips this step. |
| 2 | `medgemma-report-processing` | CPU | DMID free-text reports are reformatted, and VinDr reports are synthesised from its label CSVs, into **one canonical template** so the model sees a single surface form. |
| 3 | `medgemma-split` | CPU | Merged corpus → stratified `DatasetDict`. Validation and test are fixed at 1,000 records each; train is rebalanced BI-RADS-primary / ACR-secondary, with augmentation flagged on oversampled duplicates only. |
| 4 | `medgemma-train-eval` | **GPU** | QLoRA fine-tune, then generation on the held-out test split with closed-set ACR/BI-RADS probabilities, imbalance-aware metrics, and calibration. |
| 5 | `medgemma-analysis` | CPU | Confusion matrices, per-finding detection, split composition, reliability diagrams, ordinal and clinical-safety metrics. |

### Canonical report format

Both corpora are normalised to the same layout, which keeps the target machine-parseable:

```text
Breast Composition: <density description> (ACR <A|B|C|D>).

BI-RADS: <comma-separated categories, e.g. "3" or "3, 5">

Findings:
- <finding description, ending with (BI-RADS <value>) when abnormal>
- <finding description>
```

Asymmetry findings are excluded from both corpora by design — a single mammographic view
cannot establish asymmetry.

## Data

| Dataset | Role | Notes |
| --- | --- | --- |
| [DMID](https://doi.org/10.6084/m9.figshare.24522883.v2) | Reports + images | 510 paired high-resolution mammograms with radiologist-written diagnostic reports. |
| [VinDr-Mammo](https://doi.org/10.13026/br2v-7517) | Images + labels | 20,000 images across 5,000 studies. Reports are **synthesised** from the breast-level and finding annotations into the DMID template. |

Neither dataset is redistributed here — obtain both from their sources.

### Expected Drive layout

The notebooks read from a single root (`ROOT_DIR` in each notebook's config cell), laid out as:

```text
MedGemma2026/main/
├── config/
│   └── prompts-cot-zeroshot.yaml
├── data/
│   ├── dmid/
│   │   ├── images-original/       # .tif source
│   │   ├── images-processed/      # .png, written by notebook 1
│   │   ├── reports-original/      # .txt source
│   │   └── reports-processed/     # .txt, written by notebook 2
│   ├── vindr-mammo/
│   │   ├── images-processed/<study_id>/<image_id>.png
│   │   ├── reports/               # written by notebook 2
│   │   ├── breast-level_annotations.csv
│   │   └── finding_annotations.csv
│   └── split/                     # DatasetDict, written by notebook 3
└── results/                       # predictions + metrics, written by notebook 4
```

## Model & training

- **Base:** `google/medgemma-1.5-4b-it` — a vision-language model whose MedSigLIP encoder is
  pre-trained on 33M medical image-text pairs.
- **Adaptation:** QLoRA — 4-bit NF4 weights with double quantization, bf16 compute; LoRA rank
  16 over all linear layers, plus `lm_head` and `embed_tokens`.
- **Batching:** per-device batch 8 × gradient accumulation 32 (effective 256), linear schedule,
  `eval_loss` on the validation split for checkpoint selection.
- **Prompt:** a single fixed structured prompt (`zero_shot` in
  [`config/prompts-cot-zeroshot.yaml`](config/prompts-cot-zeroshot.yaml)) specifying the ACR
  and BI-RADS lexicons and the exact output format. The same prompt is used for training,
  validation loss, and test generation.

A `chain_of_thought` variant is drafted in the same file for a future ablation; it is not
loaded by any notebook.

## Results

The table below is the **published evaluation** — MedGemma 1.5 4B-it fine-tuned on DMID only,
compared against the MedGemma 1.0 AMRG baseline (Sung et al., 2025). Full details are in the
preprint ([doi:10.64898/2026.07.22.26358655](https://doi.org/10.64898/2026.07.22.26358655)):

| Metric | AMRG Baseline (MedGemma 1.0) | DB-ATRG (MedGemma 1.5) |
| --- | --- | --- |
| BLEU-4 | N/A | **0.4730** |
| ROUGE-L | 0.4968 | **0.8650** |
| METEOR | 0.5541 | **0.9001** |
| Word-Level F1 | 0.4978 | **0.6789** |
| BI-RADS Accuracy | 0.3529 | **0.4276** |
| ACR Density Accuracy | 0.4902 | **0.7039** |

On a simulated cohort of 100 cases, the DB-ATRG priority queue surfaced **every** BI-RADS 4/5
malignancy within the first **20%** of the reading workload versus **40%** for FIFO, and moved
the mean rank of severe cases from **42.8** to **3**.

> The notebooks in this repository are a **later pipeline** that adds VinDr-Mammo to the
> training corpus and rebuilds report processing, splitting, and evaluation. It trains a
> different adapter with a different prompt and does **not** reproduce the results above.

Published adapter: `chocoCaro/medgemma-1.5-4b-it-sft-lora-dmid`.

## Running the notebooks

Everything is written for Google Colab with Drive mounted.

1. Populate the Drive layout above with DMID and VinDr-Mammo, and place
   `prompts-cot-zeroshot.yaml` in `main/config/`.
2. Point `ROOT_DIR` in each notebook at that folder.
3. Add a Colab secret named `HF_TOKEN` with access to the MedGemma model.
4. Run notebooks 1–3 on a CPU runtime, then 4–5 on a GPU runtime.

Dependencies are installed in-notebook: `transformers`, `trl`, `peft`, `bitsandbytes`,
`datasets`, `evaluate`, `rouge-score`, `scikit-learn`, `opencv-python`, `matplotlib`.

## Team

- **Van Phan** — Project Manager & Researcher
- **Nguyen Nhat Cuong Tran** — AI Engineer & Software Engineer
- **Ngo Tan Dat Bui** — Researcher
- **Dr. Russell Jeter** — Advisor

## License

For academic and research purposes.
