from pathlib import Path

import yaml


def load_yaml(file_path: Path) -> dict:
    if not file_path.exists():
        raise FileNotFoundError(f"{file_path} does not exist")

    with open(file_path, encoding="utf-8") as stream:
        return yaml.safe_load(stream)
