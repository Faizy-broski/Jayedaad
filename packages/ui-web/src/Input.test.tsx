import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from './Input';

describe('Input', () => {
  it('renders with the provided value and forwards standard input props', () => {
    render(<Input aria-label="Email" defaultValue="test@example.com" readOnly />);
    expect(screen.getByLabelText('Email')).toHaveValue('test@example.com');
  });
});
