import { useQueue } from "@/hooks/use-queue";
import { IconEye, IconPhoto } from "@tabler/icons-react";

export const ArchivePage = () => {
  const { queueItems } = useQueue();

  const scansWithImages = queueItems.filter((item) => item.imageUrl);

  return (
    <div className="flex flex-col gap-8 flex-1 overflow-y-auto p-6 lg:p-8 bg-background">
      <div>
        <h2 className="text-2xl font-bold text-card-foreground">
          Patient Archive
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Browse all uploaded mammography scans.
        </p>
      </div>

      {scansWithImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <IconPhoto className="size-12 mb-3 opacity-50" />
          <p className="text-sm font-medium">No scans available</p>
          <p className="text-xs mt-1">
            Upload scans from the dashboard to see them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {scansWithImages.map((item, index) => (
            <div
              key={`${item.patientId}-${index}`}
              className="relative group rounded-lg overflow-hidden bg-black aspect-4/5 shadow-md border border-border"
            >
              <img
                alt={`Scan for patient ${item.patientId}`}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity"
                src={item.imageUrl}
              />
              <div className="absolute inset-0 flex flex-col justify-end p-3 bg-linear-to-t from-black/80 to-transparent">
                <span className="text-white text-xs font-medium">
                  {item.patientId}
                </span>
                <span className="text-white/70 text-[10px]">
                  {item.sex}, {item.age}y &middot; {item.timeAdded}
                </span>
              </div>
              <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary">
                <IconEye className="size-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
