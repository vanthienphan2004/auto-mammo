from fastapi import APIRouter, File, Form, UploadFile, status

from app.services.report import ReportService

router = APIRouter()


@router.post("", status_code=status.HTTP_200_OK)
async def generate_report(
    image: UploadFile = File(...), notes: str | None = Form(None)
):
    return await ReportService.generate_report(image, notes)
