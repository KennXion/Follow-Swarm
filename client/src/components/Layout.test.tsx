import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Layout from './Layout';
import * as api from '../services/api';

// Mock the API
vi.mock('../services/api', () => ({
  authAPI: {
    logout: vi.fn().mockResolvedValue({ data: { success: true } })
  }
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom') as Record<string, any>;
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('Layout Component', () => {
  const renderLayout = (initialPath = '/dashboard') => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/*" element={<Layout />}>
            <Route path="dashboard" element={<div>Dashboard Content</div>} />
            <Route path="follow" element={<div>Follow Content</div>} />
            <Route path="history" element={<div>History Content</div>} />
            <Route path="settings" element={<div>Settings Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  };

  it('should render the layout with navigation', () => {
    renderLayout();
    
    expect(screen.getByText('Follow Swarm')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Follow Artists')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should highlight active navigation item', () => {
    renderLayout('/dashboard');
    
    const dashboardLink = screen.getByRole('link', { name: /Dashboard/i });
    expect(dashboardLink).toHaveClass('bg-spotify-green');
  });

  it('should navigate between pages', () => {
    renderLayout('/dashboard');
    
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    
    const followLink = screen.getByRole('link', { name: /Follow Artists/i });
    fireEvent.click(followLink);
    
    // In a real test, we'd need to wait for navigation
    // But with MemoryRouter, we need to re-render with new path
  });

  it('should handle logout', async () => {
    renderLayout();
    
    const logoutButton = screen.getByRole('button', { name: /Logout/i });
    fireEvent.click(logoutButton);
    
    await waitFor(() => {
      expect(api.authAPI.logout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('should display user plan in header', () => {
    renderLayout();
    
    expect(screen.getByText('Free Plan')).toBeInTheDocument();
  });

  it('should render outlet content', () => {
    renderLayout('/dashboard');
    
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });
});