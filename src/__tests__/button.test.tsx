import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

describe('Button Component', () => {
  it('should render with correct text', () => {
    render(<button>Click Me</button>)
    expect(screen.getByText('Click Me')).toBeInTheDocument()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<button disabled>Disabled Button</button>)
    expect(screen.getByText('Disabled Button')).toBeDisabled()
  })
})