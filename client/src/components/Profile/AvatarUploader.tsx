import React, { useRef, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import config from '@/lib/config';
import { Loader2, Upload, Trash2, Image as ImageIcon } from 'lucide-react';

interface AvatarUploaderProps {
  currentUrl?: string | null;
  size?: number; // px
  onUpdated?: (updates: { avatar?: string; avatarUrl?: string }) => void;
}

const AvatarUploader: React.FC<AvatarUploaderProps> = ({ currentUrl, size = 96, onUpdated }) => {
  const { updateUser } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const baseOrigin = useMemo(() => {
    // Convert API base (ends with /api) into origin for static files
    const api = config.api.baseUrl.replace(/\/$/, '');
    return api.replace(/\/api$/, '');
  }, []);

  const ensureAbsolute = (pathOrUrl?: string | null): string | null => {
    if (!pathOrUrl) return null;
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    const cleaned = pathOrUrl.replace(/^\/?api\//, '/');
    return `${baseOrigin}${cleaned.startsWith('/') ? '' : '/'}${cleaned}`;
  };

  const shownUrl = preview || ensureAbsolute(currentUrl) || null;

  const onPick = () => inputRef.current?.click();

  const onDrop: React.DragEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await onFile(e.dataTransfer.files[0]);
    }
  };

  const onFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const token = localStorage.getItem('token') || '';
      const r = await fetch(`${config.api.baseUrl}/users/me/avatar`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.message || 'Failed to upload avatar');

      // Prefer absolute URL if provided
      const avatarAbs = data.user?.avatar || data.avatarUrl || data.avatar;
      const avatarRel = data.avatar;

      await updateUser({ avatar: avatarAbs, avatarUrl: avatarAbs });
      onUpdated?.({ avatar: avatarAbs, avatarUrl: avatarAbs || ensureAbsolute(avatarRel) || undefined });
    } catch (err) {
      console.error('Avatar upload failed:', err);
      alert((err as any)?.message || 'Failed to upload avatar');
      setPreview(null);
    } finally {
      setLoading(false);
      // reset input so same file can be selected again
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onRemove = async () => {
    if (!confirm('Remove your profile picture?')) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const r = await fetch(`${config.api.baseUrl}/users/me/avatar`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data?.message || 'Failed to remove avatar');
      }
      await updateUser({ avatar: undefined as any, avatarUrl: undefined as any });
      setPreview(null);
      onUpdated?.({});
    } catch (err) {
      console.error('Remove avatar failed:', err);
      alert((err as any)?.message || 'Failed to remove avatar');
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative rounded-full overflow-hidden border border-blue-200 bg-blue-50 flex items-center justify-center"
        style={{ width: size, height: size }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        {shownUrl ? (
          <img
            src={shownUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/8.x/initials/svg?seed=User`; }}
          />
        ) : (
          <ImageIcon className="w-10 h-10 text-blue-300" />
        )}
        {loading && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
            onClick={onPick}
            disabled={loading}
          >
            <Upload className="w-4 h-4" /> Upload
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-60"
            onClick={onRemove}
            disabled={loading}
          >
            <Trash2 className="w-4 h-4" /> Remove
          </button>
        </div>
        <p className="text-xs text-blue-600">PNG, JPG, GIF up to 5MB. Drag & drop supported.</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files && e.target.files[0] && onFile(e.target.files[0])}
        className="hidden"
      />
    </div>
  );
};

export default AvatarUploader;
