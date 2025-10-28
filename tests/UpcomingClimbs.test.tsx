import { render, screen } from '@testing-library/react';
import UpcomingClimbs from '@/components/dashboard/UpcomingClimbs';
import { describe, it, expect } from 'vitest';

// mock climbs data
const mockClimbs = [
  {
    id: 1,
    mountain_name: 'Mount Hood',
    elevation: 11239,
    planned_start_date: '2026-05-27',
    location: 'Oregon',
    status: 'planned',
  },
  {
    id: 2,
    mountain_name: 'Mount St. Helens',
    elevation: 8365,
    planned_start_date: '2026-08-10',
    location: 'Washington',
    status: 'planned',
  },
];

describe('<UpcomingClimbs />', () => {
  it('renders loading skeletons when isLoading=true', () => {
    render(<UpcomingClimbs climbs={[]} isLoading={true} />);
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });

  it('renders upcoming climb names when loaded', () => {
    render(<UpcomingClimbs climbs={mockClimbs} isLoading={false} />);
    expect(screen.getByText(/Mount Hood/i)).toBeInTheDocument();
    expect(screen.getByText(/Mount St\. Helens/i)).toBeInTheDocument();
  });

  it("renders a 'View all →' link", () => {
    render(<UpcomingClimbs climbs={mockClimbs} isLoading={false} />);
    const link = screen.getByRole('link', { name: /view all/i });
    expect(link).toHaveAttribute('href', '/Climbs');
  });
});
