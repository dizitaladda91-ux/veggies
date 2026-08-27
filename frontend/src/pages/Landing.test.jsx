import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Landing } from './Landing';

describe('Landing page', () => {
  it('renders the hero call to action', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Grow with VEGGIE/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Become an affiliate/i })).toBeInTheDocument();
  });
});
