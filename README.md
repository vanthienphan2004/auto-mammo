<p align="center">
  <h1 align="center">🩺 AutoMammo</h1>
  <p align="center">
    <strong>Density &amp; BI-RADS – Aware Triage and Report Generation (DB-ATRG) System</strong>
  </p>
  <p align="center">
    AI-powered mammography report generation and urgency-based case triage for radiologists.
  </p>
</p>

---

## Overview

**AutoMammo** is a full-stack clinical decision-support application that helps radiologists by:

1. **Generating structured mammography reports** from uploaded mammogram images using a fine-tuned [MedGemma 1.5 4B-it](https://ai.google.dev/gemma/docs/medgemma) vision-language model.
2. **Triaging cases by clinical urgency** — replacing the traditional FIFO (First-In, First-Out) worklist with an intelligent queue that prioritizes high-risk patients based on ACR breast density and BI-RADS severity scores.

> Traditional mammography workflows process cases in arrival order, which can delay diagnosis for patients with dense breast tissue or high-severity findings. AutoMammo reorders the worklist so the most critical cases are reviewed first.

## Key Features

| Feature | Description |
|---|---|
| **AI Report Generation** | Upload a mammogram and receive a structured radiology report with breast composition, BI-RADS category, and findings. |
| **Urgency Scoring** | Each case is automatically scored using a cumulative urgency formula based on BI-RADS and ACR density. |
| **Priority Queue** | Cases are sorted by urgency score so radiologists review the most critical patients first. |
| **Density Flagging** | ACR Category D (Extremely Dense) cases are automatically flagged for supplemental screening. |
| **Patient Archive** | Browse and review all previously uploaded mammography scans. |
| **Authentication** | Secure access via Clerk authentication. |

## How the Urgency Score Works

The urgency score $S$ is calculated as:

$$S = \sum_{i=1}^{N} (B_i)^k - D$$

Where:

- $B_i$ = BI-RADS category for each finding
- $k$ = exponential weight (default: 2)
- $N$ = total number of abnormalities
- $D$ = ACR Density value (A=1, B=2, C=3)

Higher scores indicate higher clinical priority.

## Architecture

```
auto-mammo/
├── backend/          # FastAPI + MedGemma inference server
│   └── src/
│       ├── main.py
│       └── app/
│           ├── config/       # Prompts & local configuration
│           ├── core/         # Settings, database, enums, logging
│           ├── models/       # SQLAlchemy ORM models
│           ├── routers/      # API route handlers
│           ├── services/     # Business logic & model inference
│           └── utils/        # YAML parser & helpers
├── frontend/         # React + TypeScript SPA
│   └── src/
│       ├── components/       # UI & dashboard components
│       ├── pages/            # Page-level views
│       ├── routes/           # TanStack Router file-based routing
│       ├── services/         # API client & Axios config
│       ├── hooks/            # Custom React hooks
│       ├── types/            # TypeScript type definitions
│       └── data/             # Mock data & queue configuration
└── notebooks/        # Training & experimentation notebooks
```

## Tech Stack

### Backend

- **Framework:** [FastAPI](https://fastapi.tiangolo.com/)
- **AI Model:** [MedGemma 1.5 4B-it](https://ai.google.dev/gemma/docs/medgemma) with LoRA adapters via [PEFT](https://github.com/huggingface/peft)
- **ML Libraries:** PyTorch, Transformers, Pillow
- **Database:** SQLAlchemy (async) with PostgreSQL
- **Server:** Uvicorn

### Frontend

- **Framework:** [React 19](https://react.dev/) with TypeScript
- **Build Tool:** [Vite 7](https://vite.dev/)
- **Routing:** [TanStack Router](https://tanstack.com/router)
- **Data Fetching:** [TanStack Query](https://tanstack.com/query)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- **Auth:** [Clerk](https://clerk.com/)
- **HTTP Client:** [Axios](https://axios-http.com/)

## Getting Started

### Prerequisites

- **Python** 3.11+
- **Node.js** 20+ and [pnpm](https://pnpm.io/)
- **PostgreSQL** database
- **Hugging Face** account with access to the MedGemma model
- **Clerk** account for authentication

### 1. Clone the repository

```bash
git clone https://github.com/your-username/auto-mammo.git
cd auto-mammo
```

### 2. Set up the backend

```bash
cd backend/src
cp .env.example .env
# Fill in DATABASE_URL, HF_TOKEN in .env

pip install -r requirements.txt
python main.py
```

The API server starts at `http://localhost:5001`.

### 3. Set up the frontend

```bash
cd frontend
cp .env.example .env
# Fill in VITE_CLERK_PUBLISHABLE_KEY, VITE_API_URL in .env

pnpm install
pnpm dev
```

The dev server starts at `http://localhost:5173`.

> For more detailed setup instructions, see the [Backend README](./backend/README.md) and [Frontend README](./frontend/README.md).

## Model Details

AutoMammo uses a fine-tuned **MedGemma 1.5 4B-it** model (`chocoCaro/medgemma-1.5-4b-it-sft-lora-dmid`) trained on the [DMID dataset](https://doi.org/10.6084/m9.figshare.24522883.v2) (510 paired mammograms and diagnostic reports) using QLoRA (4-bit NF4 quantization).

| Metric | AMRG Baseline (MedGemma 1.0) | DB-ATRG (MedGemma 1.5) |
|---|---|---|
| BLEU-4 | N/A | **0.4730** |
| ROUGE-L | 0.4968 | **0.6693** |
| METEOR | 0.5541 | **0.7187** |
| Word-Level F1 | 0.4978 | **0.6789** |
| BI-RADS Accuracy | 0.3529 | **0.4276** |
| ACR Density Accuracy | 0.4902 | **0.7039** |

## Team

- **Van Phan** — Project Manager & Researcher
- **Nguyen Nhat Cuong Tran** — AI Engineer & Software Engineer
- **Ngo Tan Dat Bui** — Researcher
- **Dr. Russell Jeter** — Advisor

## License

This project is for academic and research purposes.
