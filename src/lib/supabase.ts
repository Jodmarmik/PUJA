import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
  duration: string;
  category: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

const functionUrl = `${supabaseUrl}/functions/v1/admin`;

export async function fetchVideos(): Promise<Video[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error('Failed to load videos');
  return (data as Video[]) ?? [];
}

export async function adminVerify(password: string): Promise<boolean> {
  const res = await fetch(functionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supabaseAnonKey}` },
    body: JSON.stringify({ password, action: 'verify' }),
  });
  if (res.status === 401) return false;
  return res.ok;
}

export async function adminCreateVideo(password: string, video: Omit<Video, 'id' | 'created_at' | 'updated_at'>): Promise<Video> {
  const res = await fetch(functionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supabaseAnonKey}` },
    body: JSON.stringify({ password, action: 'create', video }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create video');
  }
  return res.json();
}

export async function adminUpdateVideo(password: string, id: string, video: Omit<Video, 'id' | 'created_at' | 'updated_at'>): Promise<Video> {
  const res = await fetch(functionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supabaseAnonKey}` },
    body: JSON.stringify({ password, action: 'update', id, video }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update video');
  }
  return res.json();
}

export async function adminDeleteVideo(password: string, id: string): Promise<void> {
  const res = await fetch(functionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supabaseAnonKey}` },
    body: JSON.stringify({ password, action: 'delete', id }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete video');
  }
}
