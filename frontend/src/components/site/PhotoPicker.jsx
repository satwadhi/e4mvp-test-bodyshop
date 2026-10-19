import { useRef } from "react";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";

const MAX_FILES = 3;
const MAX_BYTES = 10 * 1024 * 1024;

export const PhotoPicker = ({ files, setFiles, disabled }) => {
  const inputRef = useRef(null);

  const addFiles = (list) => {
    const next = [...files];
    for (const f of Array.from(list)) {
      if (next.length >= MAX_FILES) {
        toast.error(`You can attach up to ${MAX_FILES} photos`);
        break;
      }
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name} is not an image`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name} is larger than 10MB`);
        continue;
      }
      next.push({ file: f, preview: URL.createObjectURL(f) });
    }
    setFiles(next);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (i) => {
    URL.revokeObjectURL(files[i].preview);
    setFiles(files.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {files.map((f, i) => (
          <div key={f.preview} className="relative aspect-square overflow-hidden border border-[#272A34]" data-testid={`photo-preview-${i}`}>
            <img src={f.preview} alt={`Damage ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={disabled}
              className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center bg-[#0B0C0E]/90 text-white hover:bg-[#FF3B30] transition-colors"
              data-testid={`photo-remove-${i}`}
              aria-label="Remove photo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {files.length < MAX_FILES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="flex aspect-square flex-col items-center justify-center gap-2 border border-dashed border-[#3A3E4D] text-[#9E9EA9] transition-colors hover:border-[#FF3B30] hover:text-[#F4F4F6]"
            data-testid="damage-photo-add-button"
          >
            <ImagePlus className="h-6 w-6" />
            <span className="font-mono-ui text-[10px] uppercase tracking-widest">Add photo</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
        data-testid="damage-photo-upload-input"
      />
      <p className="mt-2 text-xs text-[#60626D]">Optional · up to 3 images · 10MB max each</p>
    </div>
  );
};
