// Common types used across the application

export interface Creator {
  id: string;
  name: string;
  username: string;
  bio?: string;
  avatar?: string;
  totalSales?: number;
  packCount?: number;
  joinedAt?: Date;
}

export interface Sample {
  id: string;
  title: string;
  slug: string;
  description: string;
  fileUrl: string;
  duration: number;
  bpm?: number;
  key?: string;
  tags: string[];
  waveformData: string;
  hasWav: boolean;
  hasStems: boolean;
  hasMidi: boolean;
  wavPrice: number;
  stemsPrice: number;
  midiPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SamplePack {
  id: number;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  price: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  creatorId: string;
  samples?: Sample[];
  creator?: Creator;
}

export interface AudioPlayerProps {
  url: string;
  title: string;
  bpm?: number;
  musicalKey?: string;
}

export interface FilterBarProps {
  onFilterChangeAction: (type: string, value: string | null) => void;
  activeFilters: Record<string, string | null>;
} 