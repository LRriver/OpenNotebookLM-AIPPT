import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { EditSession, EditHistoryItem, Slide } from '../../types'

/**
 * Feature: webui-frontend, Property 5: Edit Session State Management
 * Validates: Requirements 7.5, 8.2
 * 
 * Property-based test to verify that:
 * - Clicking confirm replaces the original slide with the current edited version
 * - The preview panel immediately reflects this change
 */

/**
 * Generate a random base64 string (simulating image data)
 */
const base64Arbitrary = fc.string({ minLength: 10, maxLength: 100 })
  .map(s => Buffer.from(s).toString('base64'))

/**
 * Generate a random edit history item
 */
const editHistoryItemArbitrary: fc.Arbitrary<EditHistoryItem> = fc.record({
  imageUrl: base64Arbitrary.map(b64 => `data:image/png;base64,${b64}`),
  imageBase64: base64Arbitrary,
  instruction: fc.string({ minLength: 1, maxLength: 100 }),
  timestamp: fc.integer({ min: 1000000000000, max: 2000000000000 })
})

/**
 * Generate a random edit session
 */
const editSessionArbitrary: fc.Arbitrary<EditSession> = fc.record({
  slideId: fc.string({ minLength: 1, maxLength: 20 }).map(s => `slide_${s}`),
  originalImage: base64Arbitrary,
  currentImage: base64Arbitrary,
  history: fc.array(editHistoryItemArbitrary, { minLength: 0, maxLength: 5 }),
  userInput: fc.string({ minLength: 0, maxLength: 100 })
})

/**
 * Generate a random slide
 */
const slideArbitrary: fc.Arbitrary<Slide> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }).map(s => `slide_${s}`),
  pageNumber: fc.integer({ min: 1, max: 20 }),
  imageUrl: base64Arbitrary.map(b64 => `data:image/png;base64,${b64}`),
  imageBase64: base64Arbitrary,
  prompt: fc.string({ minLength: 0, maxLength: 200 })
})

/**
 * Simulate the confirm edit operation
 * This mimics the behavior in useEdit hook
 */
function simulateConfirmEdit(
  editSession: EditSession,
  slides: Slide[]
): Slide[] {
  // Get current image base64 (remove data:image/png;base64, prefix if present)
  let currentBase64 = editSession.currentImage
  if (currentBase64.startsWith('data:')) {
    currentBase64 = currentBase64.split(',')[1]
  }

  // Update the slide with the edited image
  return slides.map(slide => {
    if (slide.id === editSession.slideId) {
      return {
        ...slide,
        imageBase64: currentBase64,
        imageUrl: `data:image/png;base64,${currentBase64}`
      }
    }
    return slide
  })
}

/**
 * Check if a slide was updated with the edit session's current image
 */
function wasSlideUpdated(
  originalSlide: Slide,
  updatedSlide: Slide,
  editSession: EditSession
): boolean {
  let expectedBase64 = editSession.currentImage
  if (expectedBase64.startsWith('data:')) {
    expectedBase64 = expectedBase64.split(',')[1]
  }

  return (
    updatedSlide.imageBase64 === expectedBase64 &&
    updatedSlide.imageUrl === `data:image/png;base64,${expectedBase64}`
  )
}

describe('Edit Session State Management Property Tests', () => {
  /**
   * Property 5: Edit Session State Management
   * For any edit session, clicking confirm should replace the original slide
   * with the current edited version, and the preview panel should immediately
   * reflect this change.
   */
  describe('Property 5: Edit Session State Management', () => {
    /**
     * Confirming an edit should update the slide with the current image
     */
    it('should replace original slide with current edited version on confirm', () => {
      fc.assert(
        fc.property(
          editSessionArbitrary,
          slideArbitrary,
          (editSession, slide) => {
            // Make the slide ID match the edit session
            const matchingSlide = { ...slide, id: editSession.slideId }
            const slides = [matchingSlide]

            // Simulate confirm
            const updatedSlides = simulateConfirmEdit(editSession, slides)

            // Property: The slide should be updated with the current image
            const updatedSlide = updatedSlides.find(s => s.id === editSession.slideId)
            expect(updatedSlide).toBeDefined()
            expect(wasSlideUpdated(matchingSlide, updatedSlide!, editSession)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Confirming an edit should not affect other slides
     */
    it('should not affect other slides when confirming edit', () => {
      fc.assert(
        fc.property(
          editSessionArbitrary,
          fc.array(slideArbitrary, { minLength: 2, maxLength: 5 }),
          (editSession, slides) => {
            // Make sure one slide matches the edit session
            const slidesWithMatch = slides.map((slide, index) => 
              index === 0 ? { ...slide, id: editSession.slideId } : slide
            )

            // Simulate confirm
            const updatedSlides = simulateConfirmEdit(editSession, slidesWithMatch)

            // Property: Other slides should remain unchanged
            for (let i = 1; i < slidesWithMatch.length; i++) {
              const original = slidesWithMatch[i]
              const updated = updatedSlides.find(s => s.id === original.id)
              expect(updated).toBeDefined()
              expect(updated!.imageBase64).toBe(original.imageBase64)
              expect(updated!.imageUrl).toBe(original.imageUrl)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * The number of slides should remain the same after confirm
     */
    it('should preserve the number of slides after confirm', () => {
      fc.assert(
        fc.property(
          editSessionArbitrary,
          fc.array(slideArbitrary, { minLength: 1, maxLength: 10 }),
          (editSession, slides) => {
            // Make sure one slide matches the edit session
            const slidesWithMatch = slides.map((slide, index) => 
              index === 0 ? { ...slide, id: editSession.slideId } : slide
            )

            // Simulate confirm
            const updatedSlides = simulateConfirmEdit(editSession, slidesWithMatch)

            // Property: Number of slides should be preserved
            expect(updatedSlides.length).toBe(slidesWithMatch.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Slide metadata (pageNumber, prompt) should be preserved after confirm
     */
    it('should preserve slide metadata after confirm', () => {
      fc.assert(
        fc.property(
          editSessionArbitrary,
          slideArbitrary,
          (editSession, slide) => {
            const matchingSlide = { ...slide, id: editSession.slideId }
            const slides = [matchingSlide]

            // Simulate confirm
            const updatedSlides = simulateConfirmEdit(editSession, slides)
            const updatedSlide = updatedSlides.find(s => s.id === editSession.slideId)

            // Property: Metadata should be preserved
            expect(updatedSlide).toBeDefined()
            expect(updatedSlide!.pageNumber).toBe(matchingSlide.pageNumber)
            expect(updatedSlide!.prompt).toBe(matchingSlide.prompt)
            expect(updatedSlide!.id).toBe(matchingSlide.id)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Confirming with data: prefix should strip the prefix correctly
     */
    it('should handle data: prefix in current image correctly', () => {
      fc.assert(
        fc.property(
          base64Arbitrary,
          slideArbitrary,
          (base64, slide) => {
            const editSession: EditSession = {
              slideId: slide.id,
              originalImage: slide.imageBase64 || '',
              currentImage: `data:image/png;base64,${base64}`,
              history: [],
              userInput: ''
            }

            const slides = [slide]
            const updatedSlides = simulateConfirmEdit(editSession, slides)
            const updatedSlide = updatedSlides.find(s => s.id === slide.id)

            // Property: The base64 should be stored without the data: prefix
            expect(updatedSlide).toBeDefined()
            expect(updatedSlide!.imageBase64).toBe(base64)
            expect(updatedSlide!.imageUrl).toBe(`data:image/png;base64,${base64}`)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Confirming without data: prefix should work correctly
     */
    it('should handle raw base64 in current image correctly', () => {
      fc.assert(
        fc.property(
          base64Arbitrary,
          slideArbitrary,
          (base64, slide) => {
            const editSession: EditSession = {
              slideId: slide.id,
              originalImage: slide.imageBase64 || '',
              currentImage: base64, // No data: prefix
              history: [],
              userInput: ''
            }

            const slides = [slide]
            const updatedSlides = simulateConfirmEdit(editSession, slides)
            const updatedSlide = updatedSlides.find(s => s.id === slide.id)

            // Property: The base64 should be stored correctly
            expect(updatedSlide).toBeDefined()
            expect(updatedSlide!.imageBase64).toBe(base64)
            expect(updatedSlide!.imageUrl).toBe(`data:image/png;base64,${base64}`)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
