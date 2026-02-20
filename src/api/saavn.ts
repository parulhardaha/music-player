import type { SearchSongsResponse, SaavnSongResult, PlayableSong } from '../types/saavn';

const BASE = 'https://saavn.sumit.co';

function getImageUrl(images: { link?: string; url?: string }[]): string {
  const best = images.find((i) => i.link || i.url);
  return best?.link || best?.url || '';
}

function getPlayUrl(urls: { quality: string; link?: string; url?: string }[]): string {
  const order = ['320kbps', '160kbps', '96kbps', '48kbps', '12kbps'];
  for (const q of order) {
    const u = urls.find((x) => x.quality === q);
    if (u?.link || u?.url) return u.link || u.url || '';
  }
  const first = urls[0];
  return first?.link || first?.url || '';
}

function getArtistsString(r: SaavnSongResult): string {
  const primary = r.artists?.primary;
  if (Array.isArray(primary) && primary.length > 0) {
    return primary.map((a) => a.name).join(', ');
  }
  if (typeof r.primaryArtists === 'string' && r.primaryArtists.trim()) {
    return r.primaryArtists.trim();
  }
  return 'Unknown';
}

function toPlayableSong(r: SaavnSongResult): PlayableSong {
  const duration =
    typeof r.duration === 'number' ? r.duration : parseInt(String(r.duration || '0'), 10) || 0;
  return {
    id: r.id,
    name: r.name,
    artists: getArtistsString(r),
    albumName: r.album?.name,
    imageUrl: getImageUrl(r.image),
    durationSeconds: duration,
    playUrl: getPlayUrl(r.downloadUrl || []),
  };
}

export async function searchSongs(query: string): Promise<PlayableSong[]> {
  const q = encodeURIComponent(query.trim());
  const res = await fetch(`${BASE}/api/search/songs?query=${q}`);
  const json: SearchSongsResponse = await res.json();
  const data = json.data;
  if (!data?.results) return [];
  return data.results.map(toPlayableSong);
}

/** Pool of search queries; we pick random ones each time for variety */
const SUGGESTED_QUERY_POOL = [
  'hindi hits',
  'bollywood',
  'arijit singh',
  'diljit dosanjh',
  'shreya goshal',
  'atif aslam',
  'badshah',
  'honey singh',
  'lata mangeshkar',
  'kishore kumar',
  'romantic hindi songs',
  'punjabi hits',
  'taylor swift',
  'ed sheeran',
  'coldplay',
  'latest bollywood',
  'party songs hindi',
  'acoustic hindi',
  'arijit singh romantic',
  'neha kakkar',
];

const SUGGESTED_QUERY_COUNT = 4;
const SUGGESTED_SONGS_LIMIT = 15;

function pickRandomQueries(pool: string[], count: number): string[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export async function fetchSuggested(): Promise<PlayableSong[]> {
  const queries = pickRandomQueries(SUGGESTED_QUERY_POOL, SUGGESTED_QUERY_COUNT);
  const results = await Promise.all(
    queries.map((q) => searchSongs(q))
  );
  const seen = new Set<string>();
  const merged: PlayableSong[] = [];
  for (const list of results) {
    for (const s of list) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        merged.push(s);
      }
    }
  }
  const shuffled = merged.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, SUGGESTED_SONGS_LIMIT);
}
