import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { loadApiConfig, saveApiConfig, validateApiConfig, loadFullApiConfig } from '../ApiConfigForm'
import { ApiConfig } from '../../types'

/**
 * Feature: webui-frontend, Property 2: API Credentials Persistence
 * Validates: Requirements 3.2
 * 
 * Property-based test to verify that API credentials are correctly
 * persisted to and restored from localStorage.
 * 
 * For any API credentials entered by the user, saving and then reloading
 * should restore the same credentials from local storage.
 */
describe('ApiConfigForm Property Tests', () => {
  // Clear localStorage before and after each test
  beforeEach(() => {
    localStorage.clear()
  })
  
  afterEach(() => {
    localStorage.clear()
  })

  /**
   * Property 2: API Credentials Persistence
   * Empty localStorage should return empty config
   * Note: This test must run first to ensure clean state
   */
  it('should return empty config when localStorage is empty', () => {
    // Ensure localStorage is completely clean
    localStorage.clear()
    
    // Verify the key doesn't exist
    expect(localStorage.getItem('aippt_full_api_config')).toBeNull()
    
    const loaded = loadFullApiConfig()
    
    // Should return default empty config
    expect(loaded.image.apiKey).toBe('')
    expect(loaded.image.baseUrl).toBe('')
    expect(loaded.text.apiKey).toBe('')
    expect(loaded.text.baseUrl).toBe('')
  })

  /**
   * Property 2: API Credentials Persistence
   * For any valid API config, saving and loading should return the same config
   */
  it('should persist and restore API credentials correctly (round-trip)', () => {
    fc.assert(
      fc.property(
        // Generate random API configs
        fc.record({
          apiKey: fc.string({ minLength: 1, maxLength: 100 }),
          baseUrl: fc.webUrl()
        }),
        (config: ApiConfig) => {
          // Clear before each property test iteration
          localStorage.clear()
          
          // Save the config
          saveApiConfig(config)
          
          // Load the config
          const loaded = loadApiConfig()
          
          // Property: Loaded config should equal saved config
          expect(loaded.apiKey).toBe(config.apiKey)
          expect(loaded.baseUrl).toBe(config.baseUrl)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 2: API Credentials Persistence
   * Multiple saves should only keep the latest config
   */
  it('should keep only the latest saved config', () => {
    fc.assert(
      fc.property(
        // Generate two different configs
        fc.tuple(
          fc.record({
            apiKey: fc.string({ minLength: 1, maxLength: 50 }),
            baseUrl: fc.webUrl()
          }),
          fc.record({
            apiKey: fc.string({ minLength: 1, maxLength: 50 }),
            baseUrl: fc.webUrl()
          })
        ),
        ([config1, config2]) => {
          // Save first config
          saveApiConfig(config1)
          
          // Save second config
          saveApiConfig(config2)
          
          // Load should return second config
          const loaded = loadApiConfig()
          
          expect(loaded.apiKey).toBe(config2.apiKey)
          expect(loaded.baseUrl).toBe(config2.baseUrl)
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 2: API Credentials Persistence
   * Config with special characters should be preserved
   */
  it('should preserve special characters in API credentials', () => {
    fc.assert(
      fc.property(
        fc.record({
          // Include special characters that might be in API keys
          apiKey: fc.stringOf(
            fc.constantFrom(
              ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_=+/'.split('')
            ),
            { minLength: 1, maxLength: 64 }
          ),
          baseUrl: fc.webUrl()
        }),
        (config: ApiConfig) => {
          saveApiConfig(config)
          const loaded = loadApiConfig()
          
          expect(loaded.apiKey).toBe(config.apiKey)
          expect(loaded.baseUrl).toBe(config.baseUrl)
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Validation tests for API config
   */
  describe('API Config Validation', () => {
    /**
     * Empty API key should fail validation
     */
    it('should reject empty API key', () => {
      fc.assert(
        fc.property(
          fc.webUrl(),
          (baseUrl) => {
            const config: ApiConfig = { apiKey: '', baseUrl }
            const result = validateApiConfig(config)
            
            expect(result.isValid).toBe(false)
            expect(result.errors.apiKey).toBeDefined()
          }
        ),
        { numRuns: 20 }
      )
    })

    /**
     * Empty base URL should fail validation
     */
    it('should reject empty base URL', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (apiKey) => {
            const config: ApiConfig = { apiKey, baseUrl: '' }
            const result = validateApiConfig(config)
            
            expect(result.isValid).toBe(false)
            expect(result.errors.baseUrl).toBeDefined()
          }
        ),
        { numRuns: 20 }
      )
    })

    /**
     * Invalid URL format should fail validation
     */
    it('should reject invalid URL format', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.string({ minLength: 1, maxLength: 50 }),
            // Generate strings that are not valid URLs
            fc.stringOf(
              fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
              { minLength: 1, maxLength: 20 }
            )
          ),
          ([apiKey, invalidUrl]) => {
            const config: ApiConfig = { apiKey, baseUrl: invalidUrl }
            const result = validateApiConfig(config)
            
            expect(result.isValid).toBe(false)
            expect(result.errors.baseUrl).toBeDefined()
          }
        ),
        { numRuns: 20 }
      )
    })

    /**
     * Valid config should pass validation
     */
    it('should accept valid API config', () => {
      fc.assert(
        fc.property(
          fc.record({
            // Generate non-whitespace API keys (at least one non-whitespace char)
            apiKey: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            baseUrl: fc.webUrl()
          }),
          (config: ApiConfig) => {
            const result = validateApiConfig(config)
            
            expect(result.isValid).toBe(true)
            expect(result.errors.apiKey).toBeUndefined()
            expect(result.errors.baseUrl).toBeUndefined()
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})
