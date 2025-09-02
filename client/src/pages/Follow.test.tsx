import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Follow from './Follow';
import * as api from '../services/api';

// Mock the API
vi.mock('../services/api', () => ({
  followAPI: {
    getSuggestions: vi.fn(),
    getRateLimits: vi.fn(),
    followSingle: vi.fn(),
    followBatch: vi.fn()
  }
}));

// Type assertions for mocked functions
const mockGetSuggestions = api.followAPI.getSuggestions as ReturnType<typeof vi.fn>;
const mockGetRateLimits = api.followAPI.getRateLimits as ReturnType<typeof vi.fn>;
const mockFollowSingle = api.followAPI.followSingle as ReturnType<typeof vi.fn>;
const mockFollowBatch = api.followAPI.followBatch as ReturnType<typeof vi.fn>;

// Mock alert
global.alert = vi.fn();

describe('Follow Component', () => {
  const mockSuggestions = {
    data: {
      data: [
        { artistId: 'artist1', name: 'Artist One', metadata: { followers: 1000 } },
        { artistId: 'artist2', name: 'Artist Two', metadata: { followers: 2000 } },
        { artistId: 'artist3', name: 'Artist Three', metadata: { followers: 3000 } }
      ]
    }
  };

  const mockRateLimits = {
    data: {
      data: {
        canFollow: true,
        limits: {
          hourly: { remaining: 20 },
          daily: { remaining: 450 },
          monthly: { remaining: 900 }
        }
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSuggestions.mockResolvedValue(mockSuggestions);
    mockGetRateLimits.mockResolvedValue(mockRateLimits);
    mockFollowSingle.mockResolvedValue({ data: { success: true } });
    mockFollowBatch.mockResolvedValue({ data: { success: true } });
  });

  it('should render and fetch suggestions on mount', async () => {
    render(<Follow />);
    
    expect(screen.getByText('Follow Artists')).toBeInTheDocument();
    expect(screen.getByText('Discover and follow new artists to grow your network')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(mockGetSuggestions).toHaveBeenCalledWith(20);
      expect(mockGetRateLimits).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Artist One')).toBeInTheDocument();
      expect(screen.getByText('Artist Two')).toBeInTheDocument();
      expect(screen.getByText('Artist Three')).toBeInTheDocument();
    });
  });

  it('should display follower counts', async () => {
    render(<Follow />);
    
    await waitFor(() => {
      expect(screen.getByText('1000 followers')).toBeInTheDocument();
      expect(screen.getByText('2000 followers')).toBeInTheDocument();
      expect(screen.getByText('3000 followers')).toBeInTheDocument();
    });
  });

  it('should toggle artist selection', async () => {
    const user = userEvent.setup();
    render(<Follow />);
    
    await waitFor(() => {
      expect(screen.getByText('Artist One')).toBeInTheDocument();
    });

    const artistCard = screen.getByText('Artist One').closest('div[class*="cursor-pointer"]');
    await user.click(artistCard!);
    
    expect(artistCard).toHaveClass('ring-2');
    expect(screen.getByText('1 artist selected')).toBeInTheDocument();
    
    await user.click(artistCard!);
    expect(screen.getByText('0 artists selected')).toBeInTheDocument();
  });

  it('should select all artists', async () => {
    const user = userEvent.setup();
    render(<Follow />);
    
    await waitFor(() => {
      expect(screen.getByText('Artist One')).toBeInTheDocument();
    });

    const selectAllButton = screen.getByText('Select All');
    await user.click(selectAllButton);
    
    expect(screen.getByText('3 artists selected')).toBeInTheDocument();
  });

  it('should deselect all artists', async () => {
    const user = userEvent.setup();
    render(<Follow />);
    
    await waitFor(() => {
      expect(screen.getByText('Artist One')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select All'));
    expect(screen.getByText('3 artists selected')).toBeInTheDocument();
    
    await user.click(screen.getByText('Deselect All'));
    expect(screen.getByText('0 artists selected')).toBeInTheDocument();
  });

  it('should follow single artist', async () => {
    const user = userEvent.setup();
    render(<Follow />);
    
    await waitFor(() => {
      expect(screen.getByText('Artist One')).toBeInTheDocument();
    });

    const artistCard = screen.getByText('Artist One').closest('div[class*="cursor-pointer"]');
    await user.click(artistCard!);
    
    const followButton = screen.getByRole('button', { name: /Follow Selected/i });
    await user.click(followButton);
    
    await waitFor(() => {
      expect(mockFollowSingle).toHaveBeenCalledWith('artist1');
      expect(global.alert).toHaveBeenCalledWith('Successfully queued 1 follow(s)');
    });
  });

  it('should follow batch of artists', async () => {
    const user = userEvent.setup();
    render(<Follow />);
    
    await waitFor(() => {
      expect(screen.getByText('Artist One')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select All'));
    
    const followButton = screen.getByRole('button', { name: /Follow Selected/i });
    await user.click(followButton);
    
    await waitFor(() => {
      expect(mockFollowBatch).toHaveBeenCalledWith(
        ['artist1', 'artist2', 'artist3']
      );
      expect(global.alert).toHaveBeenCalledWith('Successfully queued 3 follow(s)');
    });
  });

  it('should disable follow button when no artists selected', () => {
    render(<Follow />);
    
    const followButton = screen.getByRole('button', { name: /Follow Selected/i });
    expect(followButton).toBeDisabled();
  });

  it('should show rate limit warning when limit reached', async () => {
    const rateLimitedResponse = {
      data: {
        data: {
          canFollow: false,
          nextAvailableSlot: new Date(Date.now() + 3600000).toISOString(),
          limits: {}
        }
      }
    };
    
    mockGetRateLimits.mockResolvedValue(rateLimitedResponse);
    
    render(<Follow />);
    
    await waitFor(() => {
      expect(screen.getByText('Rate limit reached')).toBeInTheDocument();
      expect(screen.getByText(/Next available slot:/)).toBeInTheDocument();
    });
    
    const followButton = screen.getByRole('button', { name: /Follow Selected/i });
    expect(followButton).toBeDisabled();
  });

  it('should refresh suggestions', async () => {
    const user = userEvent.setup();
    render(<Follow />);
    
    await waitFor(() => {
      expect(mockGetSuggestions).toHaveBeenCalledTimes(1);
    });

    const refreshButton = screen.getByRole('button', { name: /Refresh/i });
    await user.click(refreshButton);
    
    await waitFor(() => {
      expect(mockGetSuggestions).toHaveBeenCalledTimes(2);
    });
  });

  it('should show loading state while fetching', () => {
    render(<Follow />);
    
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should show empty state when no suggestions', async () => {
    mockGetSuggestions.mockResolvedValue({
      data: { data: [] }
    });
    
    render(<Follow />);
    
    await waitFor(() => {
      expect(screen.getByText('No artist suggestions available')).toBeInTheDocument();
      expect(screen.getByText('Try refreshing or check back later')).toBeInTheDocument();
    });
  });

  it('should handle API errors', async () => {
    (api.followAPI.followSingle as jest.Mock).mockRejectedValue({
      response: { data: { error: 'API Error' } }
    });
    
    const user = userEvent.setup();
    render(<Follow />);
    
    await waitFor(() => {
      expect(screen.getByText('Artist One')).toBeInTheDocument();
    });

    const artistCard = screen.getByText('Artist One').closest('div[class*="cursor-pointer"]');
    await user.click(artistCard!);
    
    const followButton = screen.getByRole('button', { name: /Follow Selected/i });
    await user.click(followButton);
    
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('API Error');
    });
  });
});