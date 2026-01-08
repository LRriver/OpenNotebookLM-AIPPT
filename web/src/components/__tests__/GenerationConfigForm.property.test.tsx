import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { validatePageCount, validateGenerationConfig, DEFAULT_GENERATION_CONFIG } from '../GenerationConfigForm'
import { GenerationConfig } from '../../types'

/**
 * Feature: webui-frontend, Property 3: Configuration Parameter Validation
 * Validates: Requirements 4.4
 * 
 * Property-based test to verify that configuration parameter validation
 * correctly accepts valid values and rejects invalid ones.
 * 
 * For any page count value, if it is less than 1 or greater than 20 or non-numeric,
 * the system should display a validation error and prevent submission.
 */
describe('GenerationConfigForm Property Tests', () => {
  /**
   * Property 3: Configuration Parameter Validation
   * Valid page counts (1-20) should pass validation
   */
  it('should accept page counts between 1 and 20', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (pageCount) => {
          const result = validatePageCount(pageCount)
          
          // Property: All integers 1-20 should be valid
          expect(result.isValid).toBe(true)
          expect(result.error).toBeUndefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 3: Configuration Parameter Validation
   * Page counts less than 1 should fail validation
   */
  it('should reject page counts less than 1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 0 }),
        (pageCount) => {
          const result = validatePageCount(pageCount)
          
          // Property: All integers <= 0 should be invalid
          expect(result.isValid).toBe(false)
          expect(result.error).toBeDefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 3: Configuration Parameter Validation
   * Page counts greater than 20 should fail validation
   */
  it('should reject page counts greater than 20', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 21, max: 1000 }),
        (pageCount) => {
          const result = validatePageCount(pageCount)
          
          // Property: All integers > 20 should be invalid
          expect(result.isValid).toBe(false)
          expect(result.error).toBeDefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 3: Configuration Parameter Validation
   * Non-integer numbers should fail validation
   */
  it('should reject non-integer page counts', () => {
    fc.assert(
      fc.property(
        // Generate floats that are not integers using double
        fc.double({ min: 0.1, max: 20.9, noNaN: true }).filter(n => !Number.isInteger(n)),
        (pageCount) => {
          const result = validatePageCount(pageCount)
          
          // Property: Non-integers should be invalid
          expect(result.isValid).toBe(false)
          expect(result.error).toBeDefined()
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 3: Configuration Parameter Validation
   * NaN should fail validation
   */
  it('should reject NaN as page count', () => {
    const result = validatePageCount(NaN)
    
    expect(result.isValid).toBe(false)
    expect(result.error).toBeDefined()
  })

  /**
   * Property 3: Configuration Parameter Validation
   * Non-number types should fail validation
   */
  it('should reject non-number types as page count', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(),
          fc.boolean(),
          fc.constant(null),
          fc.constant(undefined),
          fc.array(fc.integer()),
          fc.object()
        ),
        (invalidValue) => {
          const result = validatePageCount(invalidValue)
          
          // Property: Non-numbers should be invalid
          expect(result.isValid).toBe(false)
          expect(result.error).toBeDefined()
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Full generation config validation tests
   */
  describe('Full Generation Config Validation', () => {
    /**
     * Valid configs should pass validation
     */
    it('should accept valid generation configs', () => {
      fc.assert(
        fc.property(
          fc.record({
            pageCount: fc.integer({ min: 1, max: 20 }),
            quality: fc.constantFrom('1K', '2K', '4K') as fc.Arbitrary<'1K' | '2K' | '4K'>,
            aspectRatio: fc.constantFrom('16:9', '4:3') as fc.Arbitrary<'16:9' | '4:3'>
          }),
          (config: GenerationConfig) => {
            const result = validateGenerationConfig(config)
            
            // Property: Valid configs should pass
            expect(result.isValid).toBe(true)
            expect(Object.keys(result.errors).length).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Invalid page count should fail full config validation
     */
    it('should reject configs with invalid page count', () => {
      fc.assert(
        fc.property(
          fc.record({
            pageCount: fc.oneof(
              fc.integer({ min: -100, max: 0 }),
              fc.integer({ min: 21, max: 100 })
            ),
            quality: fc.constantFrom('1K', '2K', '4K') as fc.Arbitrary<'1K' | '2K' | '4K'>,
            aspectRatio: fc.constantFrom('16:9', '4:3') as fc.Arbitrary<'16:9' | '4:3'>
          }),
          (config: GenerationConfig) => {
            const result = validateGenerationConfig(config)
            
            // Property: Invalid page count should fail
            expect(result.isValid).toBe(false)
            expect(result.errors.pageCount).toBeDefined()
          }
        ),
        { numRuns: 50 }
      )
    })

    /**
     * Default config should always be valid
     */
    it('should accept default generation config', () => {
      const result = validateGenerationConfig(DEFAULT_GENERATION_CONFIG)
      
      expect(result.isValid).toBe(true)
      expect(Object.keys(result.errors).length).toBe(0)
    })
  })

  /**
   * Boundary value tests
   */
  describe('Boundary Values', () => {
    it('should accept minimum valid page count (1)', () => {
      const result = validatePageCount(1)
      expect(result.isValid).toBe(true)
    })

    it('should accept maximum valid page count (20)', () => {
      const result = validatePageCount(20)
      expect(result.isValid).toBe(true)
    })

    it('should reject page count just below minimum (0)', () => {
      const result = validatePageCount(0)
      expect(result.isValid).toBe(false)
    })

    it('should reject page count just above maximum (21)', () => {
      const result = validatePageCount(21)
      expect(result.isValid).toBe(false)
    })
  })
})
