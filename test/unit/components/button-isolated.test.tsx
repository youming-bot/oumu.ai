// Test Button component in isolation

import { render } from '@testing-library/react';
import * as React from 'react';
import { Button } from '@/components/ui/button';

test('Button can be imported and used', () => {
  expect(Button).toBeDefined();
  expect(typeof Button).toBe('object'); // React.forwardRef wrapper

  // Try to render it
  const mockProps = {
    children: 'Click me',
    onClick: jest.fn(),
    className: 'test-class',
  };

  // This should not throw
  expect(() => {
    render(React.createElement(Button, mockProps));
  }).not.toThrow();
});
