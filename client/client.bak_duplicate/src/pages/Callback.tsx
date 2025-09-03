import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader } from 'lucide-react';

const Callback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // The backend will handle the OAuth callback and set the session
    // We just need to redirect to the dashboard
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-spotify-black to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <Loader className="h-12 w-12 text-spotify-green animate-spin mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Connecting to Spotify...</h2>
        <p className="text-gray-400">Please wait while we complete your authentication</p>
      </div>
    </div>
  );
};

export default Callback;