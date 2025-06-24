import { ProcessedSample } from "@/types/sample"

interface QualityMetrics {
  bitrate: number
  dynamicRange: number
  noiseFloor: number
  clippingPercentage: number
  quality: 'low' | 'medium' | 'high'
}

export class BatchProcessor {
  async processAudio(file: File): Promise<ProcessedSample> {
    if (!file.type.includes('audio')) {
      throw new Error('Invalid file type. Only audio files are accepted.')
    }

    try {
      // Create an audio context for analysis
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      const audioContext = new AudioContextClass()
      const arrayBuffer = await file.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      // Calculate peak amplitude and quality metrics
      const [peakAmplitude, qualityMetrics] = await Promise.all([
        this.calculatePeakAmplitude(audioBuffer),
        this.analyzeQuality(audioBuffer, file)
      ])

      // Generate waveform data
      const waveformData = await this.generateWaveform(audioBuffer)

      // Detect BPM and key with confidence scores
      const [bpmResult, keyResult] = await Promise.all([
        this.detectBPMWithConfidence(audioBuffer),
        this.detectKeyWithConfidence(audioBuffer)
      ])

      // Extract metadata
      const metadata: ProcessedSample = {
        title: file.name.replace(/\.[^/.]+$/, ""),
        bpm: bpmResult.bpm,
        bpmConfidence: bpmResult.confidence,
        key: keyResult.key,
        keyConfidence: keyResult.confidence,
        duration: audioBuffer.duration,
        format: file.type,
        sampleRate: audioBuffer.sampleRate,
        bitDepth: this.getBitDepth(file.type),
        channels: audioBuffer.numberOfChannels,
        hasWav: true,
        hasStems: false,
        hasMidi: false,
        wavPrice: 0.99,
        stemsPrice: null,
        midiPrice: null,
        peakAmplitude,
        waveformData,
        quality: qualityMetrics
      }

      return metadata
    } catch (error) {
      console.error('Error processing audio:', error)
      throw new Error('Failed to process audio file')
    }
  }

  private calculatePeakAmplitude(audioBuffer: AudioBuffer): number {
    let maxAmplitude = 0
    const channels = audioBuffer.numberOfChannels

    for (let channel = 0; channel < channels; channel++) {
      const channelData = audioBuffer.getChannelData(channel)
      for (let i = 0; i < channelData.length; i++) {
        const amplitude = Math.abs(channelData[i])
        if (amplitude > maxAmplitude) {
          maxAmplitude = amplitude
        }
      }
    }

    return maxAmplitude
  }

  private async analyzeQuality(audioBuffer: AudioBuffer, file: File): Promise<QualityMetrics> {
    const channelData = audioBuffer.getChannelData(0)
    const bitrate = (file.size * 8) / audioBuffer.duration // bits per second
    
    // Calculate dynamic range
    let max = -Infinity
    let min = Infinity
    let sum = 0
    let clippingCount = 0
    
    for (let i = 0; i < channelData.length; i++) {
      const sample = channelData[i]
      if (sample > max) max = sample
      if (sample < min) min = sample
      sum += Math.abs(sample)
      
      // Count clipping instances (samples at or very near maximum amplitude)
      if (Math.abs(sample) > 0.99) clippingCount++
    }
    
    const dynamicRange = 20 * Math.log10(Math.max(Math.abs(max), Math.abs(min)))
    const averageLevel = sum / channelData.length
    const noiseFloor = 20 * Math.log10(averageLevel)
    const clippingPercentage = (clippingCount / channelData.length) * 100

    // Determine quality level
    const quality = this.determineQualityLevel(bitrate, dynamicRange, noiseFloor, clippingPercentage)

    return {
      bitrate,
      dynamicRange,
      noiseFloor,
      clippingPercentage,
      quality
    }
  }

  private determineQualityLevel(
    bitrate: number,
    dynamicRange: number,
    noiseFloor: number,
    clippingPercentage: number
  ): 'low' | 'medium' | 'high' {
    let score = 0

    // Bitrate scoring
    if (bitrate >= 320000) score += 3
    else if (bitrate >= 192000) score += 2
    else score += 1

    // Dynamic range scoring
    if (dynamicRange >= 60) score += 3
    else if (dynamicRange >= 40) score += 2
    else score += 1

    // Noise floor scoring
    if (noiseFloor <= -60) score += 3
    else if (noiseFloor <= -40) score += 2
    else score += 1

    // Clipping penalty
    if (clippingPercentage <= 0.1) score += 3
    else if (clippingPercentage <= 1) score += 1
    else score -= 1

    // Determine final quality level
    if (score >= 10) return 'high'
    if (score >= 6) return 'medium'
    return 'low'
  }

  private getBitDepth(format: string): number {
    switch (format) {
      case 'audio/wav':
      case 'audio/wave':
        return 16
      case 'audio/flac':
        return 24
      default:
        return 16
    }
  }

  private async generateWaveform(audioBuffer: AudioBuffer): Promise<number[]> {
    const samples = 200 // Increased number of points for better resolution
    const channelData = audioBuffer.getChannelData(0)
    const blockSize = Math.floor(channelData.length / samples)
    const waveform: number[] = []

    for (let i = 0; i < samples; i++) {
      const start = i * blockSize
      let max = 0
      let min = 0
      for (let j = 0; j < blockSize; j++) {
        const amplitude = channelData[start + j]
        if (amplitude > max) max = amplitude
        if (amplitude < min) min = amplitude
      }
      waveform.push(max, min) // Store both peaks for better visualization
    }

    return waveform
  }

  private async detectBPMWithConfidence(audioBuffer: AudioBuffer): Promise<{ bpm: number | null, confidence: number }> {
    try {
      const channelData = audioBuffer.getChannelData(0)
      const sampleRate = audioBuffer.sampleRate
      
      // Calculate energy over time with overlapping windows
      const energyChunkSize = Math.floor(sampleRate / 20) // 50ms chunks with overlap
      const overlap = Math.floor(energyChunkSize / 2)
      const energies: number[] = []
      
      for (let i = 0; i < channelData.length - energyChunkSize; i += overlap) {
        let energy = 0
        for (let j = 0; j < energyChunkSize; j++) {
          energy += channelData[i + j] * channelData[i + j]
        }
        energies.push(energy / energyChunkSize)
      }

      // Find peaks using adaptive thresholding
      const peaks: number[] = []
      const windowSize = 10
      
      for (let i = windowSize; i < energies.length - windowSize; i++) {
        const localThreshold = this.calculateLocalThreshold(energies, i, windowSize)
        if (energies[i] > localThreshold &&
            energies[i] > energies[i-1] &&
            energies[i] > energies[i+1]) {
          peaks.push(i)
        }
      }

      // Calculate intervals and their consistency
      const intervals: number[] = []
      for (let i = 1; i < peaks.length; i++) {
        intervals.push(peaks[i] - peaks[i-1])
      }

      if (intervals.length > 0) {
        // Calculate average interval and standard deviation
        const averageInterval = intervals.reduce((a, b) => a + b) / intervals.length
        const variance = intervals.reduce((acc, val) => acc + Math.pow(val - averageInterval, 2), 0) / intervals.length
        const stdDev = Math.sqrt(variance)

        // Convert to BPM
        const bpm = Math.round(60 / (averageInterval * 0.05)) // Convert to BPM (adjusted for overlap)
        
        // Calculate confidence based on consistency of intervals
        const coefficientOfVariation = stdDev / averageInterval
        let confidence = Math.max(0, 1 - coefficientOfVariation)

        // Adjust confidence based on reasonable BPM range
        if (bpm < 60 || bpm > 200) {
          confidence *= 0.5
        }

        return {
          bpm: bpm >= 60 && bpm <= 200 ? bpm : null,
          confidence: Number(confidence.toFixed(2))
        }
      }

      return { bpm: null, confidence: 0 }
    } catch (error) {
      console.error('Error detecting BPM:', error)
      return { bpm: null, confidence: 0 }
    }
  }

  private calculateLocalThreshold(energies: number[], index: number, windowSize: number): number {
    const start = Math.max(0, index - windowSize)
    const end = Math.min(energies.length, index + windowSize)
    const windowValues = energies.slice(start, end)
    const sorted = [...windowValues].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    return median * 1.5
  }

  private async detectKeyWithConfidence(audioBuffer: AudioBuffer): Promise<{ key: string | null, confidence: number }> {
    try {
      const channelData = audioBuffer.getChannelData(0)
      const sampleRate = audioBuffer.sampleRate
      const fftSize = 4096 // Increased for better frequency resolution
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = fftSize

      // Create a temporary buffer source
      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(analyser)

      // Define note frequencies and names
      const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
      const noteStrengths = new Array(12).fill(0)
      const frequencyData = new Float32Array(analyser.frequencyBinCount)

      // Analyze multiple segments for better accuracy
      const segments = 8
      const segmentLength = Math.floor(channelData.length / segments)
      
      for (let segment = 0; segment < segments; segment++) {
        analyser.getFloatFrequencyData(frequencyData)
        
        for (let i = 0; i < frequencyData.length; i++) {
          const frequency = i * sampleRate / fftSize
          if (frequency > 20 && frequency < 5000) { // Focus on musically relevant frequencies
            const noteNumber = Math.round(12 * Math.log2(frequency / 440) + 69) % 12
            const magnitude = Math.pow(10, frequencyData[i] / 20)
            noteStrengths[noteNumber] += magnitude
          }
        }
      }

      // Normalize note strengths
      const total = noteStrengths.reduce((a, b) => a + b, 0)
      const normalizedStrengths = noteStrengths.map(s => s / total)

      // Find the dominant note and calculate confidence
      let maxStrength = 0
      let dominantNote = 0
      
      for (let i = 0; i < 12; i++) {
        if (normalizedStrengths[i] > maxStrength) {
          maxStrength = normalizedStrengths[i]
          dominantNote = i
        }
      }

      // Calculate confidence based on how dominant the strongest note is
      const confidence = Number((maxStrength * 3).toFixed(2)) // Scale up for more meaningful values

      return {
        key: notes[dominantNote],
        confidence: Math.min(confidence, 1) // Ensure confidence doesn't exceed 1
      }
    } catch (error) {
      console.error('Error detecting key:', error)
      return { key: null, confidence: 0 }
    }
  }
} 