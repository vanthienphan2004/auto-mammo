from fastapi import APIRouter

from .report import router as report_router

router = APIRouter(prefix="/api")
router.include_router(report_router, prefix="/report", tags=["Report"])
