/**
 * Example Frontend Test
 * Verify test setup works
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Simple component for testing
function TestComponent({ text }: { text: string }) {
  return <div data-testid="test">{text}</div>;
}

describe('Frontend Test Setup', () => {
  it('should render a component', () => {
    render(<TestComponent text="Hello" />);
    expect(screen.getByTestId('test')).toHaveTextContent('Hello');
  });
});
