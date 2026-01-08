import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { validateMarkdownFile } from '../FileUpload'

/**
 * Feature: webui-frontend, Property 1: File Upload Validation
 * Validates: Requirements 2.1, 2.2, 2.3
 * 
 * Property-based test to verify that the file upload validation correctly
 * accepts .md files and rejects all other file types.
 * 
 * For any uploaded file, if the file extension is not .md, the system should
 * reject it; if the extension is .md, the system should accept it.
 */
describe('FileUpload Property Tests', () => {
  /**
   * Property 1: File Upload Validation
   * For any file with .md extension, validation should return true
   */
  it('should accept any file with .md extension', () => {
    fc.assert(
      fc.property(
        // Generate random valid filenames with .md extension
        fc.tuple(
          // Random filename base (alphanumeric, underscores, hyphens)
          fc.stringOf(
            fc.constantFrom(
              ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-'.split('')
            ),
            { minLength: 1, maxLength: 50 }
          ),
          // Random case for .md extension
          fc.constantFrom('.md', '.MD', '.Md', '.mD')
        ),
        ([baseName, extension]) => {
          const filename = baseName + extension
          
          // Property: All .md files should be accepted
          expect(validateMarkdownFile(filename)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 1: File Upload Validation
   * For any file without .md extension, validation should return false
   */
  it('should reject any file without .md extension', () => {
    fc.assert(
      fc.property(
        // Generate random filenames with non-.md extensions
        fc.tuple(
          // Random filename base
          fc.stringOf(
            fc.constantFrom(
              ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-'.split('')
            ),
            { minLength: 1, maxLength: 50 }
          ),
          // Random non-.md extension
          fc.constantFrom(
            '.txt', '.pdf', '.doc', '.docx', '.html', '.js', '.ts', '.tsx',
            '.json', '.xml', '.csv', '.png', '.jpg', '.gif', '.mp4', '.zip',
            '.exe', '.py', '.java', '.cpp', '.c', '.h', '.css', '.scss',
            '.yaml', '.yml', '.toml', '.ini', '.conf', '.log', '.sql',
            '.mdx', '.markdown', '.mdown', '.mkd', '.mkdn', '.mdwn', '.mdtxt',
            '', '.m', '.d', '.md.txt', '.md.bak'
          )
        ),
        ([baseName, extension]) => {
          const filename = baseName + extension
          
          // Property: All non-.md files should be rejected
          expect(validateMarkdownFile(filename)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 1: File Upload Validation
   * Edge case: Empty or null filenames should be rejected
   */
  it('should reject empty or whitespace-only filenames', () => {
    fc.assert(
      fc.property(
        // Generate empty or whitespace strings
        fc.constantFrom('', ' ', '  ', '\t', '\n', '   \t\n  '),
        (filename) => {
          // Property: Empty/whitespace filenames should be rejected
          expect(validateMarkdownFile(filename)).toBe(false)
        }
      ),
      { numRuns: 10 }
    )
  })

  /**
   * Property 1: File Upload Validation
   * The validation should be case-insensitive for .md extension
   */
  it('should be case-insensitive for .md extension', () => {
    fc.assert(
      fc.property(
        // Generate random filename base
        fc.stringOf(
          fc.constantFrom(
            ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-'.split('')
          ),
          { minLength: 1, maxLength: 30 }
        ),
        (baseName) => {
          // All case variations of .md should be accepted
          const variations = ['.md', '.MD', '.Md', '.mD']
          
          for (const ext of variations) {
            const filename = baseName + ext
            expect(validateMarkdownFile(filename)).toBe(true)
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 1: File Upload Validation
   * Files with .md in the middle but different extension should be rejected
   */
  it('should reject files with .md in middle but different extension', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          // Random filename containing .md
          fc.stringOf(
            fc.constantFrom(
              ...'abcdefghijklmnopqrstuvwxyz0123456789_-'.split('')
            ),
            { minLength: 1, maxLength: 20 }
          ),
          // Non-.md extension
          fc.constantFrom('.txt', '.pdf', '.doc', '.html', '.bak')
        ),
        ([baseName, extension]) => {
          // Filename like "readme.md.bak" or "file.md.txt"
          const filename = baseName + '.md' + extension
          
          // Property: Should be rejected because final extension is not .md
          expect(validateMarkdownFile(filename)).toBe(false)
        }
      ),
      { numRuns: 50 }
    )
  })
})
