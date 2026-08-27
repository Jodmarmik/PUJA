import { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Plus, Pencil, Trash2, X, Film, Star, Search } from 'lucide-react';
import {
  fetchVideos,
  adminVerify,
  adminCreateVideo,
  adminUpdateVideo,
  adminDeleteVideo,
  type Video,
} from '@/lib/supabase';

interface AdminPanelProps {
  onExit: () => void;
}

export function AdminPanel({ onExit }: AdminPanelProps) {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const ok = await adminVerify(password);
      if (ok) {
        setAuthed(true);
      } else {
        setAuthError('Wrong password. Try again.');
      }
    } catch {
      setAuthError('Could not connect. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-red-600 tracking-tighter">
              PUJ<span className="text-white">AFLIX</span>
            </h1>
            <p className="text-white/50 text-sm mt-2">Admin Panel</p>
          </div>
          <form onSubmit={handleAuth} className="bg-[#1a1a1a] rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 text-white/70">
              <Lock className="w-5 h-5" />
              <span className="text-sm">Enter admin password to continue</span>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className="w-full bg-[#141414] text-white rounded-md px-4 py-3 outline-none border border-white/10 focus:border-red-600 transition"
            />
            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            <button
              type="submit"
              disabled={authLoading || !password}
              className="w-full bg-red-600 text-white rounded-md py-3 font-semibold hover:bg-red-700 transition disabled:opacity-50"
            >
              {authLoading ? 'Checking...' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={onExit}
              className="w-full text-white/50 hover:text-white transition text-sm"
            >
              Back to Pujaflix
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <AdminDashboard password={password} onExit={onExit} />;
}

function AdminDashboard({ password, onExit }: { password: string; onExit: () => void }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchVideos();
      setVideos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this video permanently?')) return;
    try {
      await adminDeleteVideo(password, id);
      setVideos((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const filtered = videos.filter((v) => v.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#141414]">
      <header className="bg-[#1a1a1a] border-b border-white/10 sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 md:px-8 py-3">
          <div className="flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-red-600 tracking-tighter">
              PUJ<span className="text-white">AFLIX</span>
              <span className="text-white/40 text-sm font-normal ml-2">Admin</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setEditingVideo(null); setShowForm(true); }}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-red-700 transition"
            >
              <Plus className="w-4 h-4" /> Add Video
            </button>
            <button
              onClick={onExit}
              className="flex items-center gap-2 text-white/70 hover:text-white transition text-sm px-3 py-2"
            >
              <ArrowLeft className="w-4 h-4" /> Exit
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-8 py-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center bg-[#1a1a1a] border border-white/10 rounded-md px-3 py-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search videos..."
              className="bg-transparent text-white text-sm px-2 outline-none w-full"
            />
          </div>
          <span className="text-white/50 text-sm">{videos.length} videos</span>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Film className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 text-lg mb-2">No videos yet</p>
            <p className="text-white/30 text-sm mb-4">Click "Add Video" to add your first video.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((video) => (
              <div key={video.id} className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-white/5 hover:border-white/20 transition group">
                <div className="relative aspect-video bg-black/40">
                  {video.thumbnail_url ? (
                    <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="w-10 h-10 text-white/20" />
                    </div>
                  )}
                  {video.is_featured && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                      <Star className="w-3 h-3 fill-white" /> Featured
                    </div>
                  )}
                  {video.duration && (
                    <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                      {video.duration}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-white font-medium text-sm mb-1 line-clamp-1">{video.title}</h3>
                  <p className="text-white/40 text-xs mb-2">{video.category}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditingVideo(video); setShowForm(true); }}
                      className="flex items-center gap-1 text-white/70 hover:text-white text-xs px-2 py-1 bg-white/5 rounded hover:bg-white/10 transition"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-red-500/10 rounded hover:bg-red-500/20 transition"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <VideoForm
          password={password}
          editingVideo={editingVideo}
          onClose={() => { setShowForm(false); setEditingVideo(null); }}
          onSaved={() => { setShowForm(false); setEditingVideo(null); load(); }}
        />
      )}
    </div>
  );
}

function VideoForm({ password, editingVideo, onClose, onSaved }: {
  password: string;
  editingVideo: Video | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: editingVideo?.title || '',
    description: editingVideo?.description || '',
    thumbnail_url: editingVideo?.thumbnail_url || '',
    video_url: editingVideo?.video_url || '',
    duration: editingVideo?.duration || '',
    category: editingVideo?.category || 'Movies',
    is_featured: editingVideo?.is_featured || false,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.video_url.trim()) {
      setFormError('Title and video embed link are required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editingVideo) {
        await adminUpdateVideo(password, editingVideo.id, form);
      } else {
        await adminCreateVideo(password, form);
      }
      onSaved();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#1a1a1a] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#1a1a1a] z-10">
          <h2 className="text-white text-lg font-semibold">
            {editingVideo ? 'Edit Video' : 'Add New Video'}
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label="Title" required>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. My Awesome Video"
              className="form-input"
            />
          </Field>

          <Field label="Video Embed Link" required hint="Paste YouTube, Dailymotion, or Mega NZ embed/share link">
            <input
              value={form.video_url}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=... or https://mega.nz/..."
              className="form-input"
            />
          </Field>

          <Field label="Thumbnail URL" hint="Paste an image link for the video poster">
            <input
              value={form.thumbnail_url}
              onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="form-input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Duration">
              <input
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="e.g. 1h 32m"
                className="form-input"
              />
            </Field>

            <Field label="Category">
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Movies, TV Shows"
                className="form-input"
              />
            </Field>
          </div>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short description shown on the video page"
              rows={3}
              className="form-input resize-none"
            />
          </Field>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
              className="w-5 h-5 accent-red-600"
            />
            <span className="text-white text-sm flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" /> Feature this video in the hero banner
            </span>
          </label>

          {formError && <p className="text-red-500 text-sm">{formError}</p>}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-red-600 text-white px-6 py-2.5 rounded-md font-semibold hover:bg-red-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingVideo ? 'Update Video' : 'Add Video'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-white/60 hover:text-white transition px-4 py-2.5"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-white/70 text-sm mb-1.5">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {hint && <p className="text-white/30 text-xs mt-1">{hint}</p>}
    </div>
  );
}
