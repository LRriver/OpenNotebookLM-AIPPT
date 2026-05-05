import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
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

          // Property: Layout should have a resizable workbench structure
          const mainContent = container.querySelector('main')
          expect(mainContent).toBeTruthy()
          
          const workbench = mainContent?.querySelector('[data-testid="resizable-layout"]')
          expect(workbench).toBeTruthy()

          // Property: Three panel shells should be present for desktop resizing
          expect(workbench?.querySelectorAll('[data-layout-panel]').length).toBe(3)
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
          expect(header?.textContent).toContain('AI PPT 工作台')

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

  it('should keep the top bar product-focused without technical capability tags', () => {
    render(
      <Layout
        leftPanel={<div>Left</div>}
        centerPanel={<div>Center</div>}
        rightPanel={<div>Right</div>}
      />
    )

    expect(screen.queryByText('逐页编辑')).not.toBeInTheDocument()
    expect(screen.queryByText('OpenAI-compatible')).not.toBeInTheDocument()
    expect(screen.queryByText('PDF / PPTX')).not.toBeInTheDocument()
  })

  it('should account for resize handles and gaps in desktop width allocation', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    })

    const { container } = render(
      <Layout
        leftPanel={<div>Left</div>}
        centerPanel={<div>Center</div>}
        rightPanel={<div>Right</div>}
      />
    )

    const workbench = container.querySelector('[data-testid="resizable-layout"]') as HTMLElement
    expect(workbench.style.gridTemplateColumns).toBe('25fr 0.5rem 34fr 0.5rem 41fr')

    const panels = Array.from(container.querySelectorAll('[data-layout-panel]')) as HTMLElement[]
    expect(panels).toHaveLength(3)
    panels.forEach(panel => {
      expect(panel.style.flexBasis).toBe('')
    })
  })
})
