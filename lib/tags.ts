export const GENRE_PREFIX = "genre:"
export const INSTRUMENT_PREFIX = "instrument:"

export const GENRES = [
  "Hip Hop",
  "Trap",
  "Pop",
  "R&B",
  "Soul",
  "Rock",
  "Drill",
  "Electronic"
] as const

export const INSTRUMENTS = [
  "Drums",
  "Bass",
  "Keys",
  "Guitar",
  "Synth",
  "Vocals",
  "FX",
  "Other"
] as const

export type Genre = typeof GENRES[number]
export type Instrument = typeof INSTRUMENTS[number]

export interface TagsManager {
  genres: Genre[]
  instruments: Instrument[]
  addGenre: (genre: Genre) => string[]
  removeGenre: (genre: Genre) => string[]
  setInstrument: (instrument: Instrument) => string[]
  removeInstrument: () => string[]
  hasGenre: (genre: Genre) => boolean
  hasInstrument: (instrument: Instrument) => boolean
}

export function createTagsManager(tags: string[] = []): TagsManager {
  const getGenres = (): Genre[] => {
    return tags
      .filter(tag => tag.startsWith(GENRE_PREFIX))
      .map(tag => tag.replace(GENRE_PREFIX, "")) as Genre[]
  }

  const getInstruments = (): Instrument[] => {
    return tags
      .filter(tag => tag.startsWith(INSTRUMENT_PREFIX))
      .map(tag => tag.replace(INSTRUMENT_PREFIX, "")) as Instrument[]
  }

  const addGenre = (genre: Genre): string[] => {
    const currentGenres = getGenres()
    const nonGenreTags = tags.filter(tag => !tag.startsWith(GENRE_PREFIX))

    // If genre already exists, remove it
    if (currentGenres.includes(genre)) {
      return [
        ...nonGenreTags,
        ...currentGenres
          .filter(g => g !== genre)
          .map(g => `${GENRE_PREFIX}${g}`)
      ]
    }

    // If we have 2 genres, replace the oldest one
    if (currentGenres.length >= 2) {
      return [
        ...nonGenreTags,
        `${GENRE_PREFIX}${currentGenres[1]}`,
        `${GENRE_PREFIX}${genre}`
      ]
    }

    // Add the new genre
    return [
      ...nonGenreTags,
      ...currentGenres.map(g => `${GENRE_PREFIX}${g}`),
      `${GENRE_PREFIX}${genre}`
    ]
  }

  const removeGenre = (genre: Genre): string[] => {
    const currentGenres = getGenres()
    const nonGenreTags = tags.filter(tag => !tag.startsWith(GENRE_PREFIX))

    return [
      ...nonGenreTags,
      ...currentGenres
        .filter(g => g !== genre)
        .map(g => `${GENRE_PREFIX}${g}`)
    ]
  }

  const setInstrument = (instrument: Instrument): string[] => {
    const nonInstrumentTags = tags.filter(tag => !tag.startsWith(INSTRUMENT_PREFIX))
    return [...nonInstrumentTags, `${INSTRUMENT_PREFIX}${instrument}`]
  }

  const removeInstrument = (): string[] => {
    return tags.filter(tag => !tag.startsWith(INSTRUMENT_PREFIX))
  }

  const hasGenre = (genre: Genre): boolean => {
    return getGenres().includes(genre)
  }

  const hasInstrument = (instrument: Instrument): boolean => {
    return getInstruments().includes(instrument)
  }

  return {
    genres: getGenres(),
    instruments: getInstruments(),
    addGenre,
    removeGenre,
    setInstrument,
    removeInstrument,
    hasGenre,
    hasInstrument
  }
} 