import { useState, useEffect, useMemo } from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';
import type { Video } from '@/lib/supabase';

interface VideoPlayerProps {
  video: Video;
  onClose: () => void;
}

function parseEmbedUrl(url: string): { embedUrl: string; type: string } {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (ytMatch) {
    return { embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`, type: 'youtube' };
  }
  // Dailymotion
  const dmMatch = url.match(/dailymotion\.com\/(?:video|embed\/video)\/([a-zA-Z0-9]+)/);
  if (dmMatch) {
    return { embedUrl: `https://www.dailymotion.com/embed/video/${dmMatch[1]}`, type: 'dailymotion' };
  }
  // Mega NZ — embed via mega.io embedder
  const megaMatch = url.match(/mega\.(?:nz|co\.nz)\/(?:embed\/)?(?:#!)?([a-zA-Z0-9_-]+)(?:#([a-zA-Z0-9_-]+))?/);
  if (megaMatch) {
    const handle = megaMatch[1];
    const key = megaMatch[2] || '';
    return { embedUrl: `https://mega.nz/embed/${handle}#${key}`, type: 'mega' };
  }
  // Already an embed URL or direct link
  return { embedUrl: url, type: 'other' };
}

export function VideoPlayer({ video, onClose }: VideoPlayerProps) {
  const [muted, setMuted] = useState(false);
  const { embedUrl, type } = useMemo(() => parseEmbedUrl(video.video_url), [video.video_url]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const finalEmbedUrl = type === 'youtube' && muted
    ? `${embedUrl}?mute=1`
    : embedUrl;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-0 md:p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-5xl bg-[#181818] rounded-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 bg-black/70 rounded-full flex items-center justify-center hover:bg-black/90 transition"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <div className="relative aspect-video bg-black">
          <iframe
            src={finalEmbedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            title={video.title}
          />
        </div>

        <div className="p-4 md:p-6">
          <h2 className="text-white text-xl md:text-2xl font-bold mb-2">{video.title}</h2>
          <div className="flex items-center gap-3 mb-3">
            {video.duration && (
              <span className="text-white/60 text-sm border border-white/20 px-2 py-0.5 rounded">
                {video.duration}
              </span>
            )}
            <span className="text-red-500 text-sm">{video.category}</span>
            {type === 'youtube' && (
              <button
                onClick={() => setMuted(!muted)}
                className="text-white/60 hover:text-white transition flex items-center gap-1 text-sm"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                {muted ? 'Unmute' : 'Mute'}
              </button>
            )}
          </div>
          {video.description && (
            <p className="text-white/70 text-sm md:text-base leading-relaxed">{video.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
