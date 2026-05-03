export interface Anime {
  id: string;
  titleUa: string;
  titleEn?: string;
  descriptionUa: string;
  genres: string[];
  rating: number;
  year: number;
  posterUrl: string;
  status: 'ongoing' | 'completed';
  episodesCount: number;
  episodes?: Episode[];
}

export interface Episode {
  id: string;
  number: number;
  titleUa: string;
  durationSeconds: number;
  voices: Voice[];
}

export interface Voice {
  id: string;
  voiceType: 'uk_dubbing' | 'original_japanese';
  voiceActor: string;
  fileUrl: string;
}
