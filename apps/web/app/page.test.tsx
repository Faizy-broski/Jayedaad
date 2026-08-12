import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from './page';

describe('HomePage', () => {
  it('renders the hero heading', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: /building trust in real estate/i })).toBeInTheDocument();
  });
});
