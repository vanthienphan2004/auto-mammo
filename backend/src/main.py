from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from huggingface_hub import login

from app.core.settings import settings
from app.routers import router
from app.services.report import ReportService


@asynccontextmanager
async def lifespan(_: FastAPI):
    login(settings.hf_token)
    ReportService.load_model()

    yield

    ReportService.unload_model()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # domains
    allow_credentials=True,  # cookies
    allow_methods=["*"],  # http methods
    allow_headers=["*"],  # headers
)


@app.get("/healthz", status_code=status.HTTP_200_OK, tags=["Health"])
def health_check():
    return {"status": "ok"}


app.include_router(router)


if __name__ == "__main__":
    uvicorn.run("main:app", port=5001, reload=True)
