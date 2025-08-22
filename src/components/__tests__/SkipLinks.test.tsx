import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SkipLinks from '../SkipLinks'

describe('SkipLinks', () => {
  it('renders all skip links', () => {
    render(<SkipLinks />)
    
    expect(screen.getByText('Skip to main content')).toBeInTheDocument()
    expect(screen.getByText('Skip to balanced feed')).toBeInTheDocument()
    expect(screen.getByText('Skip to navigation')).toBeInTheDocument()
    expect(screen.getByText('Skip to search')).toBeInTheDocument()
    expect(screen.getByText('Skip to footer')).toBeInTheDocument()
  })

  it('has proper ARIA label', () => {
    render(<SkipLinks />)
    
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveAttribute('aria-label', 'Skip navigation')
  })

  it('has proper CSS classes', () => {
    render(<SkipLinks />)
    
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('skip-links')
    
    const links = screen.getAllByRole('link')
    links.forEach(link => {
      expect(link).toHaveClass('skip-link')
    })
  })

  it('renders correct number of skip links', () => {
    render(<SkipLinks />)
    
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(5)
  })
})
