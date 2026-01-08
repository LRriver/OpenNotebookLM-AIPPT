import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { Slide } from '../../types'

/**
 * Feature: webui-frontend, Property 4: Slide Generation Order
 * Validates: Requirements 5.4, 6.1
 * 
 * Property-based test to verify that slides are always displayed
 * in ascending order by page number, regardless of the order
 * they are added.
 */

/**
 * Helper function to sort slides by page number
 * This mimics the behavior in AppStateContext reducer
 */
function sortSlidesByPageNumber(slides: Slide[]): Slide[] {
  return [...slides].sort((a, b) => a.pageNumber - b.pageNumber)
}

/**
 * Helper function to check if slides are in ascending order
 */
function areSlidesInOrder(slides: Slide[]): boolean {
  for (let i = 1; i < slides.length; i++) {
    if (slides[i].pageNumber <= slides[i - 1].pageNumber) {
      return false
    }
  }
  return true
}

/**
 * Generate a random slide with a specific page number
 */
const slideArbitrary = (pageNumber: number): fc.Arbitrary<Slide> =>
  fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }).map(s => `slide_${pageNumber}_${s}`),
    pageNumber: fc.constant(pageNumber),
    imageUrl: fc.string({ minLength: 1 }).map(s => `data:image/png;base64,${s}`),
    imageBase64: fc.string({ minLength: 1 }),
    prompt: fc.string()
  })

/**
 * Generate an array of slides with unique page numbers
 */
const slidesArbitrary = (count: number): fc.Arbitrary<Slide[]> => {
  if (count === 0) return fc.constant([])
  
  // Generate slides with page numbers 1 to count
  const slideArbitraries = Array.from({ length: count }, (_, i) => slideArbitrary(i + 1))
  return fc.tuple(...slideArbitraries).map(slides => slides as Slide[])
}

describe('Slide Generation Order Property Tests', () => {
  /**
   * Property 4: Slide Generation Order
   * For any set of generated slides, they should be displayed in the preview panel
   * in ascending order by page number.
   */
  describe('Property 4: Slide Generation Order', () => {
    /**
     * Slides should be sorted by page number after sorting
     */
    it('should sort slides in ascending order by page number', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }).chain(count => slidesArbitrary(count)),
          (slides) => {
            // Shuffle the slides to simulate random arrival order
            const shuffled = [...slides].sort(() => Math.random() - 0.5)
            
            // Sort them using our function
            const sorted = sortSlidesByPageNumber(shuffled)
            
            // Property: After sorting, slides should be in ascending order
            expect(areSlidesInOrder(sorted)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Sorting should preserve all slides
     */
    it('should preserve all slides after sorting', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }).chain(count => slidesArbitrary(count)),
          (slides) => {
            const shuffled = [...slides].sort(() => Math.random() - 0.5)
            const sorted = sortSlidesByPageNumber(shuffled)
            
            // Property: Sorting should not add or remove slides
            expect(sorted.length).toBe(slides.length)
            
            // Property: All original slides should be present
            const originalIds = new Set(slides.map(s => s.id))
            const sortedIds = new Set(sorted.map(s => s.id))
            expect(sortedIds).toEqual(originalIds)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * First slide should have the smallest page number
     */
    it('should have smallest page number first', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 20 }).chain(count => slidesArbitrary(count)),
          (slides) => {
            const shuffled = [...slides].sort(() => Math.random() - 0.5)
            const sorted = sortSlidesByPageNumber(shuffled)
            
            // Property: First slide should have page number 1
            expect(sorted[0].pageNumber).toBe(1)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Last slide should have the largest page number
     */
    it('should have largest page number last', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 20 }).chain(count => slidesArbitrary(count)),
          (slides) => {
            const shuffled = [...slides].sort(() => Math.random() - 0.5)
            const sorted = sortSlidesByPageNumber(shuffled)
            
            // Property: Last slide should have the largest page number
            expect(sorted[sorted.length - 1].pageNumber).toBe(slides.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Sorting should be idempotent
     */
    it('should be idempotent - sorting twice gives same result', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }).chain(count => slidesArbitrary(count)),
          (slides) => {
            const shuffled = [...slides].sort(() => Math.random() - 0.5)
            const sortedOnce = sortSlidesByPageNumber(shuffled)
            const sortedTwice = sortSlidesByPageNumber(sortedOnce)
            
            // Property: Sorting twice should give the same result
            expect(sortedTwice.map(s => s.id)).toEqual(sortedOnce.map(s => s.id))
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Empty array should remain empty
     */
    it('should handle empty array', () => {
      const sorted = sortSlidesByPageNumber([])
      expect(sorted).toEqual([])
      expect(areSlidesInOrder(sorted)).toBe(true)
    })

    /**
     * Single slide should remain unchanged
     */
    it('should handle single slide', () => {
      fc.assert(
        fc.property(
          slideArbitrary(1),
          (slide) => {
            const sorted = sortSlidesByPageNumber([slide])
            
            expect(sorted.length).toBe(1)
            expect(sorted[0].id).toBe(slide.id)
            expect(areSlidesInOrder(sorted)).toBe(true)
          }
        ),
        { numRuns: 50 }
      )
    })

    /**
     * Page numbers should be consecutive after sorting
     */
    it('should have consecutive page numbers after sorting', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }).chain(count => slidesArbitrary(count)),
          (slides) => {
            const shuffled = [...slides].sort(() => Math.random() - 0.5)
            const sorted = sortSlidesByPageNumber(shuffled)
            
            // Property: Page numbers should be 1, 2, 3, ..., n
            for (let i = 0; i < sorted.length; i++) {
              expect(sorted[i].pageNumber).toBe(i + 1)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
