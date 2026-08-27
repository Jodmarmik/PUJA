import { useState, useEffect } from 'react';
import { Play, Info, Search, X, Plus, Check, Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchVideos, type Video } from '@/lib/supabase';
import { VideoPlayer } from '@/components/VideoPlayer';

interface BrowseViewProps {
  onAdminClick: () => void;
}

export function BrowseView({ onAdminClick }: BrowseViewProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [heroVideo, setHeroVideo] = useState<Video | null>(null);
  const [myList, setMyList] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadVideos();
    const stored = localStorage.getItem('pujaflix_mylist');
    if (stored) setMyList(new Set(JSON.parse(stored)));
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await fetchVideos();
      setVideos(data);
      const featured = data.find((v) => v.is_featured) || data[0] || null;
      setHeroVideo(featured);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const toggleMyList = (id: string) => {
    setMyList((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem('pujaflix_mylist', JSON.stringify([...next]));
      return next;
    });
  };

  const categories = Array.from(new Set(videos.map((v) => v.category)));
  const filtered = searchQuery
    ? videos.filter((v) => v.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60 text-sm">Loading Pujaflix...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-2">Something went wrong</p>
          <p className="text-white/50 text-sm">{error}</p>
          <button onClick={loadVideos} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414]">
      <NavBar
        searchOpen={searchOpen}
        setSearchOpen={setSearchOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onAdminClick={onAdminClick}
      />

      {searchQuery ? (
        <SearchResults videos={filtered} onSelect={setSelectedVideo} onToggleList={toggleMyList} myList={myList} />
      ) : (
        <>
          {heroVideo && (
            <HeroBanner video={heroVideo} onPlay={() => setSelectedVideo(heroVideo)} onMoreInfo={() => setSelectedVideo(heroVideo)} onToggleList={toggleMyList} inList={myList.has(heroVideo.id)} />
          )}

          <div className="relative z-10 -mt-32 space-y-8 pb-20">
            {myList.size > 0 && (
              <VideoRow title="My List" videos={videos.filter((v) => myList.has(v.id))} onSelect={setSelectedVideo} onToggleList={toggleMyList} myList={myList} />
            )}
            {categories.map((cat) => (
              <VideoRow key={cat} title={cat} videos={videos.filter((v) => v.category === cat)} onSelect={setSelectedVideo} onToggleList={toggleMyList} myList={myList} />
            ))}
            {videos.length === 0 && (
              <div className="flex flex-col items-center justify-center pt-32">
                <p className="text-white/50 text-lg mb-2">No videos yet</p>
                <p className="text-white/30 text-sm">Use the admin panel to add your first video.</p>
                <button onClick={onAdminClick} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition">
                  Go to Admin
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {selectedVideo && <VideoPlayer video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
    </div>
  );
}

function NavBar({ searchOpen, setSearchOpen, searchQuery, setSearchQuery, onAdminClick }: {
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  onAdminClick: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#141414]' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
      <div className="flex items-center justify-between px-4 md:px-12 py-3">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl md:text-3xl font-bold text-red-600 tracking-tighter select-none">
            PUJ<span className="text-white">AFLIX</span>
          </h1>
          <div className="hidden md:flex items-center gap-6 text-sm text-white/80">
            <span className="cursor-pointer hover:text-white transition">Home</span>
            <span className="cursor-pointer hover:text-white transition">TV Shows</span>
            <span className="cursor-pointer hover:text-white transition">Movies</span>
            <span className="cursor-pointer hover:text-white transition">New & Popular</span>
            <span className="cursor-pointer hover:text-white transition">My List</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {searchOpen ? (
            <div className="flex items-center bg-black/80 border border-white/30 rounded px-2 py-1">
              <Search className="w-4 h-4 text-white/60" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => !searchQuery && setSearchOpen(false)}
                placeholder="Titles, people, genres"
                className="bg-transparent text-white text-sm px-2 outline-none w-40 md:w-64"
              />
              <X className="w-4 h-4 text-white/60 cursor-pointer" onClick={() => { setSearchQuery(''); setSearchOpen(false); }} />
            </div>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="text-white/80 hover:text-white transition">
              <Search className="w-5 h-5" />
            </button>
          )}
          <button onClick={onAdminClick} className="text-white/80 hover:text-white transition text-sm hidden md:block">
            Admin
          </button>
        </div>
      </div>
    </nav>
  );
}

function HeroBanner({ video, onPlay, onMoreInfo, onToggleList, inList }: {
  video: Video;
  onPlay: () => void;
  onMoreInfo: () => void;
  onToggleList: (id: string) => void;
  inList: boolean;
}) {
  return (
    <div className="relative h-[85vh] w-full">
      {video.thumbnail_url ? (
        <img src={video.thumbnail_url} alt={video.title} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-red-900 via-[#141414] to-black" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/80 via-transparent to-transparent" />

      <div className="absolute bottom-32 left-4 md:left-12 right-4 md:right-12 z-20 max-w-xl">
        <h1 className="text-3xl md:text-6xl font-bold text-white mb-3 drop-shadow-lg">{video.title}</h1>
        {video.description && (
          <p className="text-white/80 text-sm md:text-lg mb-4 line-clamp-3 drop-shadow-md">{video.description}</p>
        )}
        <div className="flex items-center gap-3">
          <button onClick={onPlay} className="flex items-center gap-2 px-6 md:px-8 py-2 md:py-3 bg-white text-black rounded-md font-semibold hover:bg-white/80 transition">
            <Play className="w-5 h-5 fill-black" /> Play
          </button>
          <button onClick={onMoreInfo} className="flex items-center gap-2 px-6 md:px-8 py-2 md:py-3 bg-white/20 text-white rounded-md font-semibold hover:bg-white/30 transition backdrop-blur-sm">
            <Info className="w-5 h-5" /> More Info
          </button>
          <button onClick={() => onToggleList(video.id)} className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-white/20 border-2 border-white/40 rounded-full hover:border-white transition backdrop-blur-sm">
            {inList ? <Check className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function VideoRow({ title, videos, onSelect, onToggleList, myList }: {
  title: string;
  videos: Video[];
  onSelect: (v: Video) => void;
  onToggleList: (id: string) => void;
  myList: Set<string>;
}) {
  const [scrollX, setScrollX] = useState(0);

  const scroll = (dir: 'left' | 'right') => {
    const amount = dir === 'left' ? -window.innerWidth * 0.8 : window.innerWidth * 0.8;
    setScrollX((prev) => Math.min(0, prev + amount));
  };

  if (videos.length === 0) return null;

  return (
    <div className="group/row relative">
      <h2 className="text-white text-lg md:text-xl font-semibold px-4 md:px-12 mb-2">{title}</h2>
      <div className="relative">
        {scrollX < 0 && (
          <button onClick={() => scroll('left')} className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-black/50 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition">
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>
        )}
        <div
          className="flex gap-2 md:gap-3 overflow-hidden px-4 md:px-12 transition-transform duration-700 ease-out"
          style={{ transform: `translateX(${scrollX}px)` }}
        >
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} onSelect={onSelect} onToggleList={onToggleList} inList={myList.has(video.id)} />
          ))}
        </div>
        <button onClick={() => scroll('right')} className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-black/50 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition">
          <ChevronRight className="w-8 h-8 text-white" />
        </button>
      </div>
    </div>
  );
}

function VideoCard({ video, onSelect, onToggleList, inList }: {
  video: Video;
  onSelect: (v: Video) => void;
  onToggleList: (id: string) => void;
  inList: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative flex-shrink-0 w-36 md:w-56 cursor-pointer transition-transform duration-300"
      style={{ zIndex: hovered ? 20 : 1, transform: hovered ? 'scale(1.08)' : 'scale(1)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(video)}
    >
      <div className="relative rounded-md overflow-hidden bg-gray-800 aspect-video">
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
            <span className="text-white/40 text-xs px-2 text-center">{video.title}</span>
          </div>
        )}
        {video.duration && (
          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] md:text-xs px-1.5 py-0.5 rounded">
            {video.duration}
          </span>
        )}
      </div>
      {hovered && (
        <div className="absolute top-full left-0 right-0 bg-[#181818] rounded-b-md p-3 shadow-2xl border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(video); }}
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-white/80 transition"
            >
              <Play className="w-4 h-4 fill-black text-black" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleList(video.id); }}
              className="w-8 h-8 bg-[#141414] border border-white/40 rounded-full flex items-center justify-center hover:border-white transition"
            >
              {inList ? <Check className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
            </button>
          </div>
          <p className="text-white text-sm font-medium line-clamp-1">{video.title}</p>
          <p className="text-white/50 text-xs mt-1 line-clamp-2">{video.description}</p>
          <p className="text-red-500 text-xs mt-1">{video.category}</p>
        </div>
      )}
    </div>
  );
}

function SearchResults({ videos, onSelect, onToggleList, myList }: {
  videos: Video[];
  onSelect: (v: Video) => void;
  onToggleList: (id: string) => void;
  myList: Set<string>;
}) {
  return (
    <div className="pt-24 px-4 md:px-12 pb-20">
      <h2 className="text-white text-xl font-semibold mb-4">
        {videos.length > 0 ? `Results (${videos.length})` : 'No results found'}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} onSelect={onSelect} onToggleList={onToggleList} inList={myList.has(video.id)} />
        ))}
      </div>
    </div>
  );
}
