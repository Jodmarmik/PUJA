/*
# Create videos table for Pujaflix

1. New Tables
- `videos`
  - `id` (uuid, primary key)
  - `title` (text, not null) — video title
  - `description` (text) — optional description
  - `thumbnail_url` (text) — link to thumbnail image
  - `video_url` (text, not null) — embed link (YouTube/Dailymotion/Mega NZ)
  - `duration` (text) — video duration display string (e.g. "1h 32m")
  - `category` (text) — category/genre for row grouping
  - `is_featured` (boolean, default false) — show in hero banner
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

2. Security
- Enable RLS on `videos`.
- Public read access (anon + authenticated) — anyone can browse and watch.
- All writes (insert/update/delete) go through an edge function using the service role key,
  so no direct write policies are needed for the anon role. Only SELECT is granted to anon.

3. Notes
- The admin panel authenticates via a password sent to the edge function.
- The edge function validates the password against the ADMIN_PASSWORD secret and uses the
  service role key to perform CRUD operations.
*/

CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  thumbnail_url text DEFAULT '',
  video_url text NOT NULL,
  duration text DEFAULT '',
  category text DEFAULT 'Movies',
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can browse and watch videos
DROP POLICY IF EXISTS "public_select_videos" ON videos;
CREATE POLICY "public_select_videos" ON videos
  FOR SELECT TO anon, authenticated USING (true);

-- No insert/update/delete policies for anon — all writes go through the edge function
-- which uses the service role key and bypasses RLS.
