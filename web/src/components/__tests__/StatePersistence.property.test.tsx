import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import {
  StorageService,
  PersistedState,
  saveState,
  loadState,
  saveProject,
  loadProject,
  saveApiConfig,
  loadApiConfig,
  clearProject,
  clearAll,
  hasProject,
  hasSlides
} from '../../services/storageService'
import { Slide, ApiConfig, GenerationConfig } from '../../types'

/**
 * Feature: webui-frontend, Property 7: State Persistence Round-Trip
 * Validates: Requirements 10.1, 10.2
 * 
 * Property-based test to verify that application state is correctly
 * persisted to and restored from localStorage.
 * 
 * For any application state (slides, configuration), saving to local storage
 * and then restoring should produce an equivalent state.
 */
describe('State Persistence Property Tests', () => {
  // Clear localStorage before each test
  beforeEach(() => {
    localStorage.clear()
  })

  /**
   * Arbitrary for generating valid Slide objects
   */
  const slideArbitrary = fc.record({
    id: fc.uuid(),
    pageNumber: fc.integer({ min: 1, max: 100 }),
    imageUrl: fc.webUrl(),
    imageBase64: fc.option(fc.base64String({ minLength: 10, maxLength: 100 }), { nil: undefined }),
    prompt: fc.string({ minLength: 0, maxLength: 500 })
  })

  /**
   * Arbitrary for generating valid ApiConfig objects
   */
  const apiConfigArbitrary: fc.Arbitrary<ApiConfig> = fc.record({
    apiKey: fc.string({ minLength: 0, maxLength: 100 }),
    baseUrl: fc.oneof(fc.webUrl(), fc.constant(''))
  })

  /**
   * Arbitrary for generating valid GenerationConfig objects
   */
  const generationConfigArbitrary: fc.Arbitrary<GenerationConfig> = fc.record({
    pageCount: fc.integer({ min: 1, max: 20 }),
    quality: fc.constantFrom('1K', '2K', '4K') as fc.Arbitrary<'1K' | '2K' | '4K'>,
    aspectRatio: fc.constantFrom('16:9', '4:3') as fc.Arbitrary<'16:9' | '4:3'>
  })

  /**
   * Arbitrary for generating valid PersistedState objects
   */
  const persistedStateArbitrary: fc.Arbitrary<PersistedState> = fc.record({
    version: fc.constant(1),
    apiConfig: apiConfigArbitrary,
    currentProject: fc.option(
      fc.record({
        fileContent: fc.string({ minLength: 0, maxLength: 1000 }),
        fileName: fc.string({ minLength: 0, maxLength: 100 }),
        slides: fc.array(slideArbitrary, { minLength: 0, maxLength: 10 }),
        generationConfig: generationConfigArbitrary
      }),
      { nil: null }
    )
  })

  /**
   * Property 7: State Persistence Round-Trip
   * For any valid persisted state, saving and loading should return equivalent state
   */
  it('should persist and restore complete state correctly (round-trip)', () => {
    fc.assert(
      fc.property(
        persistedStateArbitrary,
        (state: PersistedState) => {
          // Save the state
          const saveSuccess = saveState(state)
          expect(saveSuccess).toBe(true)
          
          // Load the state
          const loaded = loadState()
          
          // Property: Loaded state should equal saved state
          expect(loaded).not.toBeNull()
          expect(loaded!.version).toBe(state.version)
          expect(loaded!.apiConfig).toEqual(state.apiConfig)
          
          if (state.currentProject === null) {
            expect(loaded!.currentProject).toBeNull()
          } else {
            expect(loaded!.currentProject).not.toBeNull()
            expect(loaded!.currentProject!.fileContent).toBe(state.currentProject.fileContent)
            expect(loaded!.currentProject!.fileName).toBe(state.currentProject.fileName)
            expect(loaded!.currentProject!.slides).toEqual(state.currentProject.slides)
            expect(loaded!.currentProject!.generationConfig).toEqual(state.currentProject.generationConfig)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 7: State Persistence Round-Trip
   * For any valid project data, saving and loading should return equivalent data
   */
  it('should persist and restore project data correctly (round-trip)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 1000 }),
        fc.string({ minLength: 0, maxLength: 100 }),
        fc.array(slideArbitrary, { minLength: 0, maxLength: 10 }),
        generationConfigArbitrary,
        (fileContent, fileName, slides, generationConfig) => {
          // Save the project
          const saveSuccess = saveProject(fileContent, fileName, slides, generationConfig)
          expect(saveSuccess).toBe(true)
          
          // Load the project
          const loaded = loadProject()
          
          // Property: Loaded project should equal saved project
          expect(loaded).not.toBeNull()
          expect(loaded!.fileContent).toBe(fileContent)
          expect(loaded!.fileName).toBe(fileName)
          expect(loaded!.slides).toEqual(slides)
          expect(loaded!.generationConfig).toEqual(generationConfig)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 7: State Persistence Round-Trip
   * For any valid API config, saving and loading should return equivalent config
   */
  it('should persist and restore API config correctly (round-trip)', () => {
    fc.assert(
      fc.property(
        apiConfigArbitrary,
        (config: ApiConfig) => {
          // Save the config
          const saveSuccess = saveApiConfig(config)
          expect(saveSuccess).toBe(true)
          
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
   * Property: Clearing project should preserve API config
   */
  it('should preserve API config when clearing project', () => {
    fc.assert(
      fc.property(
        apiConfigArbitrary,
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.array(slideArbitrary, { minLength: 1, maxLength: 5 }),
        generationConfigArbitrary,
        (apiConfig, fileContent, fileName, slides, generationConfig) => {
          // Save API config and project
          saveApiConfig(apiConfig)
          saveProject(fileContent, fileName, slides, generationConfig)
          
          // Clear project
          const clearSuccess = clearProject()
          expect(clearSuccess).toBe(true)
          
          // API config should be preserved
          const loadedApiConfig = loadApiConfig()
          expect(loadedApiConfig.apiKey).toBe(apiConfig.apiKey)
          expect(loadedApiConfig.baseUrl).toBe(apiConfig.baseUrl)
          
          // Project should be cleared
          const loadedProject = loadProject()
          expect(loadedProject).toBeNull()
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: hasProject should correctly detect saved projects
   */
  it('should correctly detect presence of saved project', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.array(slideArbitrary, { minLength: 0, maxLength: 5 }),
        generationConfigArbitrary,
        (fileContent, fileName, slides, generationConfig) => {
          // Initially no project
          expect(hasProject()).toBe(false)
          
          // Save project
          saveProject(fileContent, fileName, slides, generationConfig)
          
          // Now has project
          expect(hasProject()).toBe(true)
          
          // Clear project
          clearProject()
          
          // No project again
          expect(hasProject()).toBe(false)
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: hasSlides should correctly detect saved slides
   */
  it('should correctly detect presence of saved slides', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        generationConfigArbitrary,
        (fileContent, fileName, generationConfig) => {
          // Save project with no slides
          saveProject(fileContent, fileName, [], generationConfig)
          expect(hasSlides()).toBe(false)
          
          // Save project with slides
          const slide: Slide = {
            id: 'test-id',
            pageNumber: 1,
            imageUrl: 'https://example.com/image.png',
            prompt: 'test prompt'
          }
          saveProject(fileContent, fileName, [slide], generationConfig)
          expect(hasSlides()).toBe(true)
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: clearAll should remove all data
   */
  it('should clear all data when clearAll is called', () => {
    fc.assert(
      fc.property(
        apiConfigArbitrary,
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.array(slideArbitrary, { minLength: 1, maxLength: 5 }),
        generationConfigArbitrary,
        (apiConfig, fileContent, fileName, slides, generationConfig) => {
          // Save data
          saveApiConfig(apiConfig)
          saveProject(fileContent, fileName, slides, generationConfig)
          
          // Clear all
          const clearSuccess = clearAll()
          expect(clearSuccess).toBe(true)
          
          // All data should be cleared
          const loadedState = loadState()
          expect(loadedState).toBeNull()
          
          // API config should return defaults
          const loadedApiConfig = loadApiConfig()
          expect(loadedApiConfig.apiKey).toBe('')
          expect(loadedApiConfig.baseUrl).toBe('')
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: Multiple saves should only keep the latest state
   */
  it('should keep only the latest saved state', () => {
    fc.assert(
      fc.property(
        fc.tuple(persistedStateArbitrary, persistedStateArbitrary),
        ([state1, state2]) => {
          // Save first state
          saveState(state1)
          
          // Save second state
          saveState(state2)
          
          // Load should return second state
          const loaded = loadState()
          
          expect(loaded).not.toBeNull()
          expect(loaded!.apiConfig).toEqual(state2.apiConfig)
          
          if (state2.currentProject === null) {
            expect(loaded!.currentProject).toBeNull()
          } else {
            expect(loaded!.currentProject).toEqual(state2.currentProject)
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: Empty localStorage should return null state
   */
  it('should return null when localStorage is empty', () => {
    localStorage.clear()
    const loaded = loadState()
    expect(loaded).toBeNull()
  })

  /**
   * Property: Empty localStorage should return default API config
   */
  it('should return default API config when localStorage is empty', () => {
    localStorage.clear()
    const loaded = loadApiConfig()
    expect(loaded.apiKey).toBe('')
    expect(loaded.baseUrl).toBe('')
  })

  /**
   * Property: Storage info should be available
   */
  it('should provide storage info', () => {
    fc.assert(
      fc.property(
        persistedStateArbitrary,
        (state) => {
          saveState(state)
          
          const info = StorageService.getStorageInfo()
          expect(info.available).toBe(true)
          expect(info.used).toBeGreaterThan(0)
        }
      ),
      { numRuns: 20 }
    )
  })
})
