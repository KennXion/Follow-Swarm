import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader } from 'lucide-react';

const AuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');

    if (token && userId) {
      // Store the token in localStorage for API authentication
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      
      // Use window.location to force a full page reload
      // This ensures the App component re-checks authentication state
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } else {
      // If no token, redirect to login
      navigate('/login');
    }
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-spotify-black to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <Loader className="h-12 w-12 text-spotify-green animate-spin mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Authentication Successful!</h2>
        <p className="text-gray-400">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
};

export default AuthSuccess;