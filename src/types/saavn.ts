export interface SaavnImage {
  quality: string;
  link?: string;
  url?: string;
}

export interface SaavnDownloadUrl {
  quality: string;
  link?: string;
  url?: string;
}

export interface SaavnAlbum {
  id: string;
  name: string;
  url?: string;
}

export interface SaavnArtist {
  id: string;
  name: string;
  role?: string;
}

export interface SaavnSongResult {
  id: string;
  name: string;
  type?: string;
  album?: SaavnAlbum;
  year?: string;
  duration?: string | number;
  primaryArtists?: string;
  artists?: { primary?: SaavnArtist[] };
  image: SaavnImage[];
  downloadUrl: SaavnDownloadUrl[];
  language?: string;
}

export interface SearchSongsResponse {
  status?: string;
  success?: boolean;
  data: {
    results: SaavnSongResult[];
    total?: number;
    start?: number;
  };
}

export interface PlayableSong {
  id: string;
  name: string;
  artists: string;
  albumName?: string;
  imageUrl: string;
  durationSeconds: number;
  playUrl: string;
}
