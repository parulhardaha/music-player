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

export interface SaavnSongResult {
  id: string;
  name: string;
  type?: string;
  album: SaavnAlbum;
  year?: string;
  duration?: string;
  primaryArtists?: string;
  primaryArtistsId?: string;
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
  imageUrl: string;
  durationSeconds: number;
  playUrl: string;
}
