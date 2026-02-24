import { type ReportGeneratingPayload } from "@/types/report";
import axiosConfig from "@/services/axios.config";
import BaseEntityAPI from "@/services/api/base-entity.api";

class ReportAPI extends BaseEntityAPI {
  constructor() {
    super("report");
  }

  async getReportGeneration(payload: ReportGeneratingPayload) {
    const formData = new FormData();
    formData.append("image", payload.image);

    if (payload.notes) {
      formData.append("notes", payload.notes);
    }

    return await axiosConfig.post(`${this.baseUrl}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
}

const reportAPI = new ReportAPI();

export default reportAPI;
