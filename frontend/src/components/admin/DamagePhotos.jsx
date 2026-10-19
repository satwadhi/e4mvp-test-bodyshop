import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { adminApi } from "@/lib/api";

const PhotoThumb = ({ apptId, photo, index }) => {
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let url;
    adminApi
      .get(`/appointments/${apptId}/photos/${photo.id}`, { responseType: "blob" })
      .then((r) => {
        url = URL.createObjectURL(r.data);
        setSrc(url);
      })
      .catch(() => setFailed(true));
    return () => url && URL.revokeObjectURL(url);
  }, [apptId, photo.id]);

  return (
    <a
      href={src || undefined}
      target="_blank"
      rel="noreferrer"
      className="relative block aspect-square overflow-hidden border border-[#272A34] bg-[#121418]"
      data-testid={`appointment-photo-${index}`}
    >
      {src && <img src={src} alt={photo.original_filename} className="h-full w-full object-cover transition-transform hover:scale-105" />}
      {!src && !failed && <Loader2 className="absolute inset-0 m-auto h-5 w-5 animate-spin text-[#60626D]" />}
      {failed && <span className="absolute inset-0 flex items-center justify-center text-xs text-[#FF453A]">Failed to load</span>}
    </a>
  );
};

export const DamagePhotos = ({ appt }) => {
  if (!appt.photos?.length) return <p className="text-sm text-[#60626D]">No photos attached.</p>;
  return (
    <div className="grid grid-cols-3 gap-3" data-testid="appointment-photos">
      {appt.photos.map((p, i) => (
        <PhotoThumb key={p.id} apptId={appt.id} photo={p} index={i} />
      ))}
    </div>
  );
};
