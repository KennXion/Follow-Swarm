import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Dashboard from './Dashboard';
import * as api from '../services/api';

// Mock the API
vi.mock('../services/api', () => ({
  followAPI: {
    getStats: vi.fn(),
    getRateLimits: vi.fn()
  }
}));

describe('Dashboard Component', () => {
  const mockStats = {
    data: {
      data: {
        summary: {
          total: 100,
          completed: 80,
          pending: 15,
          failed: 5
        },
        daily: [
          { date: '2024-01-01', count: 10 },
          { date: '2024-01-02', count: 15 }
        ]
      }
    }
  };

  const mockRateLimits = {
    data: {
      data: {
        limits: {
          hourly: { count: 10, limit: 30, remaining: 20 },
          daily: { count: 50, limit: 500, remaining: 450 },
          monthly: { count: 100, limit: 1000, remaining: 900 }
        }
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    api.followAPI.getStats.mockResolvedValue(mockStats);
    api.followAPI.getRateLimits.mockResolvedValue(mockRateLimits);
  });

  it('should render loading state initially', () => {
    render(<Dashboard />);
    
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should fetch and display statistics', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(api.followAPI.getStats).toHaveBeenCalledWith('7d');
      expect(api.followAPI.getRateLimits).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument(); // Total follows
      expect(screen.getByText('80')).toBeInTheDocument(); // Completed
      expect(screen.getByText('15')).toBeInTheDocument(); // Pending
      expect(screen.getByText('80%')).toBeInTheDocument(); // Success rate
    });
  });

  it('should display stat cards with correct values', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Follows')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Success Rate')).toBeInTheDocument();
    });
  });

  it('should display rate limits', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Rate Limits')).toBeInTheDocument();
      expect(screen.getByText(/20 \/ 30/)).toBeInTheDocument(); // Hourly
      expect(screen.getByText(/450 \/ 500/)).toBeInTheDocument(); // Daily
      expect(screen.getByText(/900 \/ 1000/)).toBeInTheDocument(); // Monthly
    });
  });

  it('should handle period change', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '30d' } });

    await waitFor(() => {
      expect(api.followAPI.getStats).toHaveBeenCalledWith('30d');
    });
  });

  it('should show infinity for unlimited premium limits', async () => {
    const premiumLimits = {
      data: {
        data: {
          limits: {
            hourly: { count: 10, limit: Infinity, remaining: Infinity },
            daily: { count: 50, limit: Infinity, remaining: Infinity },
            monthly: { count: 100, limit: Infinity, remaining: Infinity }
          }
        }
      }
    };

    api.followAPI.getRateLimits.mockResolvedValue(premiumLimits);
    
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getAllByText(/∞/)).toHaveLength(3);
    });
  });

  it('should handle API errors gracefully', async () => {
    api.followAPI.getStats.mockRejectedValue(new Error('API Error'));
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch dashboard data:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('should calculate success rate correctly', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      // Success rate = (completed / total) * 100 = (80 / 100) * 100 = 80%
      expect(screen.getByText('80%')).toBeInTheDocument();
    });
  });

  it('should handle zero total follows', async () => {
    const zeroStats = {
      data: {
        data: {
          summary: {
            total: 0,
            completed: 0,
            pending: 0,
            failed: 0
          },
          daily: []
        }
      }
    };

    api.followAPI.getStats.mockResolvedValue(zeroStats);
    
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('0%')).toBeInTheDocument(); // Success rate with no data
    });
  });
});