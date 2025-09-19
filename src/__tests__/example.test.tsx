import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('Example Test', () => {
  it('should render correctly', () => {
    render(<div>Test Content</div>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should pass basic assertion', () => {
    expect(1 + 1).toBe(2);
  });
});
