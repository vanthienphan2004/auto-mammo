# AutoMammo — Backend

FastAPI server that powers mammography report generation and urgency-based case triage using a fine-tuned MedGemma 1.5 vision-language model.

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | FastAPI |
| **Server** | Uvicorn |
| **AI / ML** | PyTorch, Transformers, PEFT (LoRA) |
| **Model** | MedGemma 1.5 4B-it (QLoRA fine-tuned) |
| **Database** | SQLAlchemy (async) + PostgreSQL |
| **Configuration** | Pydantic Settings (`.env`) |
| **Image Processing** | Pillow |

## Project Structure

```
backend/
└── src/
    ├── main.py                     # Application entrypoint & FastAPI setup
    ├── requirements.txt            # Python dependencies
    ├── .env.example                # Environment variable template
    └── app/
        ├── config/
        │   ├── local.conf          # Local configuration overrides
        │   └── prompts.yaml        # System & user prompts for the model
        ├── core/
        │   ├── config.py           # App configuration loader
        │   ├── database.py         # Async SQLAlchemy engine & session
        │   ├── enums.py            # SexType, UrgencyLevel, QueueStatus enums
        │   ├── logging.py          # Structured logging setup
        │   ├── paths.py            # File path constants
        │   └── settings.py         # Pydantic Settings (env vars)
        ├── models/
        │   ├── patient.py          # Patient ORM model
        │   ├── profile.py          # User profile ORM model
        │   ├── queue_item.py       # Triage queue item ORM model
        │   ├── scan.py             # Mammography scan ORM model
        ├── routers/
        │   ├── __init__.py         # Router aggregation
        │   └── report.py           # POST /report endpoint
        ├── services/
        │   └── report.py           # ReportService (inference + urgency scoring)
        └── utils/
            └── yaml_parser.py      # YAML config file loader
```

## Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL database
- Hugging Face account with access to [MedGemma](https://ai.google.dev/gemma/docs/medgemma)

### Installation

```bash
cd backend/src

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate   # macOS/Linux
# venv\Scripts\activate    # Windows

# Install dependencies
pip install -r requirements.txt
```

### Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Async PostgreSQL connection string, e.g. `postgresql+asyncpg://user:pass@localhost/automammo` |
| `IMAGE_TEXT_TO_TEXT_MODEL` | Hugging Face model ID (default: `chocoCaro/medgemma-1.5-4b-it-sft-lora-dmid`) |
| `HF_TOKEN` | Hugging Face API token with model access |

### Running the Server

```bash
python main.py
```

The server starts at **`http://localhost:5001`** with hot reload enabled.

- Health check: `GET /healthz`
- Generate report: `POST /api/report` (multipart form with `image` and optional `notes`)

## API Reference

### `GET /healthz`

Health check endpoint.

**Response** `200 OK`

```json
{ "status": "ok" }
```

### `POST /api/report`

Generate a structured mammography report from an uploaded image.

**Request** (multipart/form-data)

| Field | Type | Required | Description |
|---|---|---|---|
| `image` | File | ✅ | Mammogram image (JPEG, PNG, TIFF) |
| `notes` | string | ❌ | Additional clinical notes |

**Response** `200 OK`

```json
{
  "report": "Findings text extracted from the generated report...",
  "urgency_score": 7
}
```

**Error Responses**

| Status | Description |
|---|---|
| `503` | Model not loaded or runtime error |
| `504` | Inference timed out |
| `500` | Unexpected server error |

## How It Works

1. **Startup** — The app authenticates with Hugging Face, downloads the MedGemma 1.5 model with LoRA adapters, and loads it into GPU/CPU memory.
2. **Upload** — A mammogram image is sent to `POST /api/report`.
3. **Inference** — The image is processed through the MedGemma model using a structured radiology prompt to generate a report covering breast composition (ACR density), BI-RADS category, and clinical findings.
4. **Extraction** — The raw report text is parsed to extract ACR density, BI-RADS categories, and findings.
5. **Urgency Scoring** — A cumulative urgency score is calculated: `S = Σ(Bᵢ)ᵏ − D`, used to prioritize cases in the triage queue.

## Database Schema

The backend uses four main ORM models:

| Model | Table | Description |
|---|---|---|
| `Profile` | `profiles` | Radiologist / user profiles (name, role, avatar) |
| `Patient` | `patients` | Patient records (code, name, sex, DOB) |
| `Scan` | `scans` | Uploaded mammography scans (image path, file metadata, clinical notes) |
| `QueueItem` | `queue_items` | Triage queue entries (urgency score, urgency level, status, assignment) |
