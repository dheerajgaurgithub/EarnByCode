import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Cropper, { Area } from 'react-easy-crop';
import './AvatarCropperModal.css';
import { X, Upload, Image as ImageIcon, ZoomIn, ZoomOut } from 'lucide-react';
interface AvatarCropperModalProps {
  open: boolean;
  onClose: () => void;
  onCropped: (file: File) => void;
}

// Convert a dropped File + crop area into a cropped JPEG File
async function cropImageToFile(file: File, croppedAreaPixels: Area, filename = 'avatar.jpg'): Promise<File> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = URL.createObjectURL(file);
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  const { width, height, x, y } = croppedAreaPixels;
  canvas.width = Math.round(width);
  canvas.height = Math.round(height);

  // Draw the requested crop directly from the source image
  ctx.drawImage(
    img,
    Math.max(0, x),
    Math.max(0, y),
    Math.min(img.width - x, width),
    Math.min(img.height - y, height),
    0,
    0,
    width,
    height
  );

  const blob: Blob = await new Promise((resolve) => canvas.toBlob(b => resolve(b as Blob), 'image/jpeg', 0.92));
  return new File([blob], filename, { type: 'image/jpeg' });
}

const AvatarCropperModal: React.FC<AvatarCropperModalProps> = ({ open, onClose, onCropped }) => {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setImageUrl(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setCroppedAreaPixels(null);
      setError(null);
    }
  }, [open]);

  const onDrop = useCallback((accepted: File[]) => {
    setError(null);
    const f = accepted?.[0];
    if (!f) return;
    if (!/^image\/(jpeg|png|webp|gif)$/i.test(f.type)) {
      setError('Only JPG, PNG, WEBP or GIF images are allowed');
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      setError('Image must be 2MB or smaller');
      return;
    }
    setFile(f);
    const url = URL.createObjectURL(f);
    setImageUrl(url);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false, accept: { 'image/*': [] } });

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!file || !croppedAreaPixels) return;
    try {
      const cropped = await cropImageToFile(file, croppedAreaPixels, 'avatar.jpg');
      onCropped(cropped);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to crop image');
    }
  }, [file, croppedAreaPixels, onClose, onCropped]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg border border-blue-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-blue-100 bg-blue-50">
          <h3 className="text-blue-900 font-semibold">Upload & Crop Avatar</h3>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-blue-100">
            <X className="w-5 h-5 text-blue-700" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {!imageUrl ? (
            <div
              {...getRootProps()}
              className={`flex flex-col items-center justify-center text-center border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-blue-200 bg-white hover:bg-blue-50'}`}
            >
              <input {...getInputProps()} />
              <ImageIcon className="h-10 w-10 text-blue-400 mb-2" />
              <p className="text-blue-900 font-medium mb-1">Drag & drop your image here</p>
              <p className="text-blue-600 text-sm mb-3">or click to browse</p>
              <button type="button" className="inline-flex items-center px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
                <Upload className="w-4 h-4 mr-2" /> Choose image
              </button>
              {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
            </div>
          ) : (
            <div>
              <div className="relative w-full h-[320px] sm:h-[360px] bg-gray-100 rounded-lg overflow-hidden">
                <Cropper
                  image={imageUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  cropShape="round"
                  showGrid={false}
                />
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => setZoom(Math.max(1, parseFloat((zoom - 0.1).toFixed(2))))} className="px-2 py-1 rounded bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100">
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-40 sm:w-60 accent-blue-600"
                  />
                  <button onClick={() => setZoom(Math.min(3, parseFloat((zoom + 0.1).toFixed(2))))} className="px-2 py-1 rounded bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100">
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setImageUrl(null)} className="px-3 py-2 rounded-lg border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 text-sm">Choose another</button>
                  <button onClick={handleConfirm} className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm">Use this crop</button>
                </div>
              </div>
              {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvatarCropperModal;
