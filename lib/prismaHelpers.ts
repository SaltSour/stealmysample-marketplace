/**
 * Prisma selection helpers for consistent and optimized database queries
 */

/**
 * Common selection for samples with minimal pack details
 */
export const sampleWithPackSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  hasWav: true,
  hasStems: true,
  hasMidi: true,
  wavPrice: true,
  stemsPrice: true,
  midiPrice: true,
  duration: true,
  bpm: true,
  key: true,
  tags: true,
  waveformData: true,
  samplePackId: true,
  samplePack: {
    select: {
      id: true,
      title: true,
      coverImage: true,
      slug: true,
      creator: {
        select: {
          id: true,
          user: {
            select: {
              name: true,
              username: true,
            },
          },
        },
      },
    },
  },
};

/**
 * Selection for cart items with necessary details
 */
export const cartItemSelect = {
  id: true,
  price: true,
  format: true,
  quantity: true,
  sampleId: true,
  samplePackId: true,
  samplePack: {
    select: {
      id: true,
      title: true,
      price: true,
      coverImage: true,
    },
  },
  sample: {
    select: {
      id: true,
      title: true,
      wavPrice: true,
      stemsPrice: true,
      midiPrice: true,
      samplePack: {
        select: {
          coverImage: true
        }
      }
    },
  },
}; 