import logging
import sys
from ast import literal_eval
from logging.handlers import TimedRotatingFileHandler
from pathlib import Path

from app.core.paths import CONFIG_DIR, ROOT_DIR


def get_logging_config(file_path: Path) -> dict:
    config = {}

    with open(file_path, encoding="utf-8") as stream:
        for line in stream:
            key, value = line.split("=")
            config[key] = value

    return config


def get_logger(name: str, log_dir: Path = ROOT_DIR / "logs") -> logging.Logger:
    log_dir.mkdir(exist_ok=True)

    config = get_logging_config(CONFIG_DIR / "local.conf")

    log_formatter = logging.Formatter(config["template"].strip())

    # Root logger
    root_logger = logging.getLogger(name)
    root_logger.handlers.clear()
    root_logger.setLevel(getattr(logging, config["level"].strip().upper()))

    # File handler
    file_handler = TimedRotatingFileHandler(
        log_dir / config["outfile"].strip(), when="midnight", encoding="utf-8"
    )
    file_handler.setFormatter(log_formatter)
    root_logger.addHandler(file_handler)

    # Console handler
    if literal_eval(config["console"].strip()):
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.DEBUG)
        console_handler.setFormatter(log_formatter)
        root_logger.addHandler(console_handler)

    # Reduce noise from third-party libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)

    return root_logger
