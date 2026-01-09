import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { EditSession, EditHistoryItem } from '../../types'

/**
 * Feature: webui-frontend, Property 6: Edit History Preservation
 * Validates: Requirements 8.3, 8.4
 * 
 * Property-based test to verify that:
 * - All previous versions are preserved in the history
 * - User can revert to any previous version in the edit history
 */

/**
 * Generate a random base64 string (simulating image data)
 */
const base64Arbitrary = fc.string({ minLength: 10, maxLength: 100 })
  .map(s => btoa(s))

/**
 * Generate a random edit history item with a specific timestamp
 */
const editHistoryItemArbitrary = (timestamp: number): fc.Arbitrary<EditHistoryItem> => fc.record({
  imageUrl: base64Arbitrary.map(b64 => `data:image/png;base64,${b64}`),
  imageBase64: base64Arbitrary,
  instruction: fc.string({ minLength: 1, maxLength: 100 }),
  timestamp: fc.constant(timestamp)
})

/**
 * Generate an array of edit history items with increasing timestamps
 */
const editHistoryArbitrary = (count: number): fc.Arbitrary<EditHistoryItem[]> => {
  if (count === 0) return fc.constant([])
  
  const baseTimestamp = 1700000000000
  const items = Array.from({ length: count }, (_, i) => 
    editHistoryItemArbitrary(baseTimestamp + i * 1000)
  )
  return fc.tuple(...items).map(arr => arr as EditHistoryItem[])
}

/**
 * Generate a random edit session with history
 */
const editSessionWithHistoryArbitrary = (historyCount: number): fc.Arbitrary<EditSession> => 
  fc.record({
    slideId: fc.string({ minLength: 1, maxLength: 20 }).map(s => `slide_${s}`),
    originalImage: base64Arbitrary,
    currentImage: base64Arbitrary,
    history: editHistoryArbitrary(historyCount),
    userInput: fc.string({ minLength: 0, maxLength: 100 })
  })

/**
 * Simulate adding a new edit to the history
 * This mimics the behavior in useEdit hook's submitEdit
 */
function simulateAddEdit(
  editSession: EditSession,
  newImageBase64: string,
  instruction: string
): EditSession {
  // Get current image base64 (remove data: prefix if present)
  let currentBase64 = editSession.currentImage
  if (currentBase64.startsWith('data:')) {
    currentBase64 = currentBase64.split(',')[1]
  }

  // Create history item for the current version
  const historyItem: EditHistoryItem = {
    imageUrl: editSession.currentImage.startsWith('data:')
      ? editSession.currentImage
      : `data:image/png;base64,${editSession.currentImage}`,
    imageBase64: currentBase64,
    instruction,
    timestamp: Date.now()
  }

  return {
    ...editSession,
    currentImage: newImageBase64,
    history: [...editSession.history, historyItem],
    userInput: ''
  }
}

/**
 * Simulate reverting to a history version
 * This mimics the behavior in useEdit hook's revertToVersion
 */
function simulateRevertToVersion(
  editSession: EditSession,
  historyItem: EditHistoryItem
): EditSession {
  // Find the index of the history item
  const index = editSession.history.findIndex(
    h => h.timestamp === historyItem.timestamp
  )

  if (index < 0) {
    return editSession
  }

  // Keep history up to (but not including) the reverted version
  const newHistory = editSession.history.slice(0, index)

  return {
    ...editSession,
    currentImage: historyItem.imageBase64,
    history: newHistory
  }
}

describe('Edit History Preservation Property Tests', () => {
  /**
   * Property 6: Edit History Preservation
   * For any edit session with multiple modifications, all previous versions
   * should be preserved in the history and the user should be able to revert
   * to any of them.
   */
  describe('Property 6: Edit History Preservation', () => {
    /**
     * Adding an edit should preserve all previous history
     */
    it('should preserve all previous history when adding new edit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 5 }).chain(count => editSessionWithHistoryArbitrary(count)),
          base64Arbitrary,
          fc.string({ minLength: 1, maxLength: 100 }),
          (editSession, newImage, instruction) => {
            const originalHistoryLength = editSession.history.length
            const originalHistory = [...editSession.history]

            const updatedSession = simulateAddEdit(editSession, newImage, instruction)

            // Property: History length should increase by 1
            expect(updatedSession.history.length).toBe(originalHistoryLength + 1)

            // Property: All original history items should be preserved
            for (let i = 0; i < originalHistoryLength; i++) {
              expect(updatedSession.history[i].timestamp).toBe(originalHistory[i].timestamp)
              expect(updatedSession.history[i].imageBase64).toBe(originalHistory[i].imageBase64)
              expect(updatedSession.history[i].instruction).toBe(originalHistory[i].instruction)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * The new history item should contain the previous current image
     */
    it('should store previous current image in new history item', () => {
      fc.assert(
        fc.property(
          editSessionWithHistoryArbitrary(0),
          base64Arbitrary,
          fc.string({ minLength: 1, maxLength: 100 }),
          (editSession, newImage, instruction) => {
            // Get expected base64 from current image
            let expectedBase64 = editSession.currentImage
            if (expectedBase64.startsWith('data:')) {
              expectedBase64 = expectedBase64.split(',')[1]
            }

            const updatedSession = simulateAddEdit(editSession, newImage, instruction)
            const newHistoryItem = updatedSession.history[updatedSession.history.length - 1]

            // Property: New history item should contain the previous current image
            expect(newHistoryItem.imageBase64).toBe(expectedBase64)
            expect(newHistoryItem.instruction).toBe(instruction)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Reverting to a version should restore that version's image
     */
    it('should restore image when reverting to a history version', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }).chain(count => editSessionWithHistoryArbitrary(count)),
          (editSession) => {
            // Pick a random history item to revert to
            const randomIndex = Math.floor(Math.random() * editSession.history.length)
            const targetHistoryItem = editSession.history[randomIndex]

            const revertedSession = simulateRevertToVersion(editSession, targetHistoryItem)

            // Property: Current image should be the reverted version's image
            expect(revertedSession.currentImage).toBe(targetHistoryItem.imageBase64)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Reverting should remove history items after the reverted version
     */
    it('should remove history items after reverted version', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }).chain(count => editSessionWithHistoryArbitrary(count)),
          (editSession) => {
            // Pick a history item that's not the last one
            const randomIndex = Math.floor(Math.random() * (editSession.history.length - 1))
            const targetHistoryItem = editSession.history[randomIndex]

            const revertedSession = simulateRevertToVersion(editSession, targetHistoryItem)

            // Property: History should only contain items before the reverted version
            expect(revertedSession.history.length).toBe(randomIndex)

            // Property: All remaining history items should be the same
            for (let i = 0; i < randomIndex; i++) {
              expect(revertedSession.history[i].timestamp).toBe(editSession.history[i].timestamp)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Reverting to the first history item should clear all history
     */
    it('should clear all history when reverting to first version', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }).chain(count => editSessionWithHistoryArbitrary(count)),
          (editSession) => {
            const firstHistoryItem = editSession.history[0]

            const revertedSession = simulateRevertToVersion(editSession, firstHistoryItem)

            // Property: History should be empty after reverting to first version
            expect(revertedSession.history.length).toBe(0)
            expect(revertedSession.currentImage).toBe(firstHistoryItem.imageBase64)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Multiple edits should create a complete history chain
     */
    it('should create complete history chain with multiple edits', () => {
      fc.assert(
        fc.property(
          editSessionWithHistoryArbitrary(0),
          fc.array(
            fc.tuple(base64Arbitrary, fc.string({ minLength: 1, maxLength: 50 })),
            { minLength: 1, maxLength: 5 }
          ),
          (initialSession, edits) => {
            let session = initialSession

            // Apply multiple edits
            for (const [newImage, instruction] of edits) {
              session = simulateAddEdit(session, newImage, instruction)
            }

            // Property: History length should equal number of edits
            expect(session.history.length).toBe(edits.length)

            // Property: Each history item should have the correct instruction
            for (let i = 0; i < edits.length; i++) {
              expect(session.history[i].instruction).toBe(edits[i][1])
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Original image should remain unchanged through edits
     */
    it('should preserve original image through all edits', () => {
      fc.assert(
        fc.property(
          editSessionWithHistoryArbitrary(0),
          fc.array(
            fc.tuple(base64Arbitrary, fc.string({ minLength: 1, maxLength: 50 })),
            { minLength: 1, maxLength: 5 }
          ),
          (initialSession, edits) => {
            const originalImage = initialSession.originalImage
            let session = initialSession

            // Apply multiple edits
            for (const [newImage, instruction] of edits) {
              session = simulateAddEdit(session, newImage, instruction)
            }

            // Property: Original image should remain unchanged
            expect(session.originalImage).toBe(originalImage)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Reverting and then editing should work correctly
     */
    it('should allow editing after reverting', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }).chain(count => editSessionWithHistoryArbitrary(count)),
          base64Arbitrary,
          fc.string({ minLength: 1, maxLength: 50 }),
          (editSession, newImage, instruction) => {
            // Revert to first version
            const firstHistoryItem = editSession.history[0]
            const revertedSession = simulateRevertToVersion(editSession, firstHistoryItem)

            // Add a new edit
            const newSession = simulateAddEdit(revertedSession, newImage, instruction)

            // Property: Should have exactly one history item (the reverted version)
            expect(newSession.history.length).toBe(1)
            expect(newSession.currentImage).toBe(newImage)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
