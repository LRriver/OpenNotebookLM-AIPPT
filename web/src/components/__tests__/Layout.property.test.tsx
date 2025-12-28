import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import * as fc from 'fast-check'
import Layout from '../Layout'

/**
 * Feature: webui-frontend, Property: Layout maintains three columns at various viewport sizes
 * Validates: Requirements 1.2
 * 
 * Property-based test to verify that the Layout component maintains its three-column
 * structure across different viewport sizes. The layout should always render three
 * distinct panels regardless of screen dimensions.
 */
describe('Layout Property Tests', () => {
  it('should maintain three columns at various viewport sizes', () => {
    fc.assert(
      fc.property(
        // Generate random viewport widths (320px to 2560px)
        fc.integer({ min: 320, max: 2560 }),
        // Generate random viewport heights (480px to 1440px)
        fc.integer({ min: 480, max: 1440 }),
        (width, height) => {
          // Set viewport size
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: width,
          })
          Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: height,
          })

          // Render layout with test content
          const { container } = render(
            <Layout
              leftPanel={<div data-testid="left-panel">Left</div>}
              centerPanel={<div data-testid="center-panel">Center</div>}
              rightPanel={<div data-testid="right-panel">Right</div>}
            />
          )

          // Verify all three panels are rendered
          const leftPanel = container.querySelector('[data-testid="left-panel"]')
          const centerPanel = container.querySelector('[data-testid="center-panel"]')
          const rightPanel = container.querySelector('[data-testid="right-panel"]')

          // Property: All three panels must exist
          expect(leftPanel).toBeTruthy()
          expect(centerPanel).toBeTruthy()
          expect(rightPanel).toBeTruthy()

          // Property: Layout should have grid structure
          const mainContent = container.querySelector('main')
          expect(mainContent).toBeTruthy()
          
          const gridContainer = mainContent?.querySelector('.grid')
          expect(gridContainer).toBeTruthy()

          // Property: Grid should have 12 columns defined
          expect(gridContainer?.classList.contains('grid-cols-12')).toBe(true)
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    )
  })

  it('should render header and main content structure', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('Left Content', 'Upload Area', 'File Panel'),
        fc.constantFrom('Center Content', 'Settings', 'Edit Panel'),
        fc.constantFrom('Right Content', 'Preview', 'Slides'),
        (leftContent, centerContent, rightContent) => {
          const { container } = render(
            <Layout
              leftPanel={<div>{leftContent}</div>}
              centerPanel={<div>{centerContent}</div>}
              rightPanel={<div>{rightContent}</div>}
            />
          )

          // Property: Header must exist
          const header = container.querySelector('header')
          expect(header).toBeTruthy()
          expect(header?.textContent).toContain('AI PPT Generator')

          // Property: Main content must exist
          const main = container.querySelector('main')
          expect(main).toBeTruthy()

          // Property: All content should be rendered
          expect(container.textContent).toContain(leftContent)
          expect(container.textContent).toContain(centerContent)
          expect(container.textContent).toContain(rightContent)
        }
      ),
      { numRuns: 100 }
    )
  })
})
