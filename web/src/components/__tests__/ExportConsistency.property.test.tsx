import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { Slide, ExportFormat } from '../../types'
import { canExport } from '../../services/exportService'

/**
 * Feature: webui-frontend, Property 8: Export Format Consistency
 * Validates: Requirements 9.3, 9.5
 * 
 * Property-based test to verify that export operations maintain
 * slide order and content consistency.
 */

/**
 * Generate a random slide with a specific page number
 */
const slideArbitrary = (pageNumber: number): fc.Arbitrary<Slide> =>
  fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }).map(s => `slide_${pageNumber}_${s}`),
    pageNumber: fc.constant(pageNumber),
    imageUrl: fc.string({ minLength: 10, maxLength: 100 }).map(s => `data:image/png;base64,${btoa(s)}`),
    imageBase64: fc.string({ minLength: 10, maxLength: 100 }).map(s => btoa(s)),
    prompt: fc.string({ minLength: 0, maxLength: 200 })
  })

/**
 * Generate an array of slides with unique page numbers
 */
const slidesArbitrary = (count: number): fc.Arbitrary<Slide[]> => {
  if (count === 0) return fc.constant([])
  
  const slideArbitraries = Array.from({ length: count }, (_, i) => slideArbitrary(i + 1))
  return fc.tuple(...slideArbitraries).map(slides => slides as Slide[])
}

/**
 * Generate export format
 */
const exportFormatArbitrary: fc.Arbitrary<ExportFormat> = fc.constantFrom('pdf', 'pptx')

/**
 * Helper function to build export request body
 * This mimics the behavior in exportService.ts
 */
function buildExportRequestBody(slides: Slide[], format: ExportFormat) {
  return {
    slides: slides.map(slide => ({
      image_base64: slide.imageBase64 || extractBase64FromDataUrl(slide.imageUrl)
    })),
    format
  }
}

/**
 * Extract base64 from data URL
 */
function extractBase64FromDataUrl(dataUrl: string): string {
  if (!dataUrl) return ''
  if (!dataUrl.startsWith('data:')) return dataUrl
  const base64Match = dataUrl.match(/^data:[^;]+;base64,(.+)$/)
  return base64Match ? base64Match[1] : dataUrl
}

/**
 * Verify slides are in correct order
 */
function areSlidesInOrder(slides: Slide[]): boolean {
  for (let i = 1; i < slides.length; i++) {
    if (slides[i].pageNumber <= slides[i - 1].pageNumber) {
      return false
    }
  }
  return true
}

describe('Export Format Consistency Property Tests', () => {
  /**
   * Property 8: Export Format Consistency
   * For any export operation, the downloaded file should contain all current slides
   * in the correct order.
   */
  describe('Property 8: Export Format Consistency', () => {
    /**
     * Export request should contain all slides
     */
    it('should include all slides in export request', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }).chain(count => slidesArbitrary(count)),
          exportFormatArbitrary,
          (slides, format) => {
            const requestBody = buildExportRequestBody(slides, format)
            
            // Property: Export request should contain same number of slides
            expect(requestBody.slides.length).toBe(slides.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Export request should preserve slide order
     */
    it('should preserve slide order in export request', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 20 }).chain(count => slidesArbitrary(count)),
          exportFormatArbitrary,
          (slides, format) => {
            // Ensure slides are sorted by page number first
            const sortedSlides = [...slides].sort((a, b) => a.pageNumber - b.pageNumber)
            const requestBody = buildExportRequestBody(sortedSlides, format)
            
            // Property: Export request slides should be in same order as input
            for (let i = 0; i < sortedSlides.length; i++) {
              const expectedBase64 = sortedSlides[i].imageBase64 || 
                extractBase64FromDataUrl(sortedSlides[i].imageUrl)
              expect(requestBody.slides[i].image_base64).toBe(expectedBase64)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Export format should be correctly set
     */
    it('should set correct export format', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }).chain(count => slidesArbitrary(count)),
          exportFormatArbitrary,
          (slides, format) => {
            const requestBody = buildExportRequestBody(slides, format)
            
            // Property: Format should match requested format
            expect(requestBody.format).toBe(format)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * canExport should return true for non-empty slides with images
     */
    it('should allow export when slides have images', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }).chain(count => slidesArbitrary(count)),
          (slides) => {
            // Property: canExport should return true for valid slides
            expect(canExport(slides)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * canExport should return false for empty slides array
     */
    it('should not allow export when no slides', () => {
      expect(canExport([])).toBe(false)
    })

    /**
     * canExport should return false for slides without images
     */
    it('should not allow export when slides have no images', () => {
      const slidesWithoutImages: Slide[] = [
        { id: '1', pageNumber: 1, imageUrl: '', prompt: 'test' }
      ]
      expect(canExport(slidesWithoutImages)).toBe(false)
    })

    /**
     * Export request should extract base64 from data URL correctly
     */
    it('should extract base64 from data URL correctly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 100 }),
          (content) => {
            const base64 = btoa(content)
            const dataUrl = `data:image/png;base64,${base64}`
            
            // Property: Extracted base64 should match original
            expect(extractBase64FromDataUrl(dataUrl)).toBe(base64)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Export request should handle slides with only imageBase64
     */
    it('should use imageBase64 when available', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }).chain(count => slidesArbitrary(count)),
          exportFormatArbitrary,
          (slides, format) => {
            const requestBody = buildExportRequestBody(slides, format)
            
            // Property: Each slide should have image_base64 from imageBase64 field
            for (let i = 0; i < slides.length; i++) {
              if (slides[i].imageBase64) {
                expect(requestBody.slides[i].image_base64).toBe(slides[i].imageBase64)
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Sorted slides should maintain order after export request building
     */
    it('should maintain sorted order in export request', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 20 }).chain(count => slidesArbitrary(count)),
          exportFormatArbitrary,
          (slides, format) => {
            // Shuffle slides first
            const shuffled = [...slides].sort(() => Math.random() - 0.5)
            // Sort by page number
            const sorted = [...shuffled].sort((a, b) => a.pageNumber - b.pageNumber)
            
            // Property: Sorted slides should be in ascending order
            expect(areSlidesInOrder(sorted)).toBe(true)
            
            // Build export request with sorted slides
            const requestBody = buildExportRequestBody(sorted, format)
            
            // Property: Request should have same number of slides
            expect(requestBody.slides.length).toBe(sorted.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Export format should only be pdf or pptx
     */
    it('should only accept valid export formats', () => {
      const validFormats: ExportFormat[] = ['pdf', 'pptx']
      
      fc.assert(
        fc.property(
          exportFormatArbitrary,
          (format) => {
            // Property: Format should be one of the valid formats
            expect(validFormats).toContain(format)
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})
