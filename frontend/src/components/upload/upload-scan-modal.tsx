import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getUrgencyLevel, useQueue } from "@/hooks/use-queue";
import reportAPI from "@/services/api/report";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconCalendar,
  IconCloudUpload,
  IconFileDescription,
  IconLoader2,
  IconSparkles,
  IconUserCircle,
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";

interface UploadScanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UploadScanModal = ({
  open,
  onOpenChange,
}: UploadScanModalProps) => {
  const { addToQueue } = useQueue();

  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [dob, setDob] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [urgencyScore, setUrgencyScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
    setReport(null);

    try {
      const response = await reportAPI.getReportGeneration({
        image: selectedFile,
        notes: notes.trim() || null,
      });

      const { report: reportText, urgency_score } = response.data;
      setReport(reportText);
      setUrgencyScore(urgency_score);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred while generating the report.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setReport(null);
    setUrgencyScore(null);
    setError(null);
  };

  const handleDone = () => {
    if (report && urgencyScore !== null) {
      const now = new Date();
      const timeAdded = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      addToQueue({
        patientId:
          patientId ||
          `#${Math.floor(100 + Math.random() * 900)}-${Math.floor(Math.random() * 1000)}`,
        patientName: patientName || undefined,
        sex: "Female",
        age: dob
          ? Math.floor(
              (Date.now() - new Date(dob).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000),
            )
          : 0,
        urgencyScore,
        urgencyLevel: getUrgencyLevel(urgencyScore),
        status: "pending",
        timeAdded,
        imageUrl: imagePreview ?? undefined,
        report,
      });
    }

    handleClose();
  };

  const handleClose = () => {
    setReport(null);
    setUrgencyScore(null);
    setError(null);
    setIsLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex flex-col max-w-[85vw] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {report ? "AI Analysis Report" : "Upload Mammography Scans"}
          </DialogTitle>
          <DialogDescription>
            {report
              ? "Review the AI-generated report below."
              : "Upload DICOM files to generate AI reports and add to the prioritization queue."}
          </DialogDescription>
        </DialogHeader>

        {report ? (
          <div className="flex-1 space-y-4 overflow-y-auto">
            <div className="flex items-center gap-4 text-sm text-muted-foreground border-b border-border pb-3">
              <span>
                <strong className="text-card-foreground">Patient:</strong>{" "}
                {patientName} ({patientId})
              </span>
              <span>
                <strong className="text-card-foreground">DOB:</strong> {dob}
              </span>
            </div>

            {imagePreview && (
              <div className="rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 border border-border">
                <img
                  src={imagePreview}
                  alt="Analyzed scan"
                  className="w-full h-auto max-h-64 object-contain"
                />
              </div>
            )}

            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2 mb-4">
                <IconSparkles className="size-4 text-primary" />
                Generated Report
              </h3>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed text-card-foreground">
                {report}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <IconArrowLeft className="size-4" />
                Back to Upload
              </Button>
              <Button onClick={handleDone} className="flex-1">
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-6 overflow-y-scroll">
            {error && (
              <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <IconAlertTriangle className="size-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                    Failed to generate report
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            )}

            <div className="relative group">
              {!selectedFile ? (
                <div className="border-2 border-dashed border-primary/30 rounded-xl bg-card hover:bg-primary/5 transition-all duration-300 p-12 text-center cursor-pointer group-hover:border-primary">
                  <input
                    accept=".dcm,image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    multiple
                    type="file"
                    onChange={handleFileSelect}
                  />
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <IconCloudUpload className="size-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">
                    Drag & Drop DICOM files here
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    Supported formats: .tif, .png, .jpg (Max 500MB)
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="pointer-events-none"
                  >
                    Browse Files
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-primary/30 rounded-xl bg-card p-4">
                  <div className="relative">
                    <button
                      onClick={handleRemoveFile}
                      disabled={isLoading}
                      className="absolute -top-2 -right-2 z-20 bg-red-400 hover:bg-red-500 text-destructive-foreground rounded-full p-1.5 shadow-lg transition-all disabled:opacity-50"
                      title="Remove image"
                    >
                      <IconX className="size-4" />
                    </button>

                    {imagePreview && (
                      <div className="rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900">
                        <img
                          src={imagePreview}
                          alt="Uploaded scan preview"
                          className="w-full h-auto max-h-100 object-contain"
                        />
                      </div>
                    )}

                    <div className="mt-3 text-center">
                      <p className="text-sm font-medium text-primary">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-card rounded-xl border border-border flex flex-col shrink-0">
              <div className="px-4 py-3 rounded-t-xl border-b border-border bg-slate-50 dark:bg-slate-900/50">
                <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                  <IconFileDescription className="size-4 text-muted-foreground" />
                  Scan Details
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <Label
                    htmlFor="patient-id"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Patient ID
                  </Label>
                  <div className="relative mt-1">
                    <IconUserCircle className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="patient-id"
                      placeholder="Ex: #123-456"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      className="pl-9"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="patient-name"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Patient Name
                  </Label>
                  <Input
                    id="patient-name"
                    placeholder="Full Name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="mt-1"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label
                    htmlFor="dob"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Date of Birth
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="dob"
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      disabled={isLoading}
                    />
                    <IconCalendar className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="notes"
                    className="gap-1 text-slate-700 dark:text-slate-300"
                  >
                    Clinical Notes
                    <span className="text-xs font-normal text-muted-foreground">
                      (Optional)
                    </span>
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Enter relevant clinical history or observations..."
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1 resize-none"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={!selectedFile || isLoading}
                    className="w-full bg-primary hover:bg-blue-700 text-white shadow-lg shadow-primary/30"
                  >
                    {isLoading ? (
                      <>
                        <IconLoader2 className="size-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <IconSparkles className="size-4" />
                        Analyze
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Cancel & Clear
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
