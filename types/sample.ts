export interface QualityMetrics {
  bitrate: number
  dynamicRange: number
  noiseFloor: number
  clippingPercentage: number
  quality: 'low' | 'medium' | 'high'
}

export interface ProcessedSample {
  title: string
  bpm: number | null
  bpmConfidence?: number
  key: string | null
  keyConfidence?: number
  duration: number | null
  format?: string
  sampleRate?: number
  bitDepth?: number
  channels?: number
  hasWav: boolean
  hasStems: boolean
  hasMidi: boolean
  wavPrice: number | null
  stemsPrice: number | null
  midiPrice: number | null
  peakAmplitude?: number
  waveformData?: number[]
  quality?: QualityMetrics
} 