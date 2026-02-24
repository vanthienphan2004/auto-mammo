import { Button } from "@/components/ui/button";
import { UploadScanModal } from "@/components/upload/upload-scan-modal";
import { IconBell, IconCloudUpload } from "@tabler/icons-react";
import { useState } from "react";

export const TopHeader = () => {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  return (
    <>
      <header className="h-16 bg-card border-b border-l border-border flex items-center justify-between px-6 lg:px-8 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-slate-800 dark:text-white">
            Radiology Workspace
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-slate-400 hover:text-primary"
          >
            <IconBell className="size-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-card" />
          </Button>
          <div className="h-8 w-px bg-border mx-2" />
          <Button
            onClick={() => setUploadModalOpen(true)}
            className="bg-primary hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20"
          >
            <IconCloudUpload className="size-4" />
            Upload New Image
          </Button>
        </div>
      </header>

      <UploadScanModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
      />
    </>
  );
};
