import { Music, Users, TrendingUp, Shield } from 'lucide-react';
import { authAPI } from '../services/api';

const Login = () => {
  const handleSpotifyLogin = () => {
    authAPI.spotifyLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-spotify-black to-gray-900 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <div className="flex items-center space-x-3 text-white">
          <Music className="h-10 w-10 text-spotify-green" />
          <span className="text-2xl font-bold">Follow Swarm</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              Grow Your Spotify Following
            </h1>
            <p className="text-xl text-gray-300">
              Join the artist community and exchange follows to boost your reach
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 my-8">
            <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
              <Users className="h-8 w-8 text-spotify-green mb-2" />
              <h3 className="text-white font-semibold">Community Growth</h3>
              <p className="text-gray-400 text-sm mt-1">
                Connect with artists worldwide
              </p>
            </div>
            <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
              <TrendingUp className="h-8 w-8 text-spotify-green mb-2" />
              <h3 className="text-white font-semibold">Smart Targeting</h3>
              <p className="text-gray-400 text-sm mt-1">
                AI-powered artist suggestions
              </p>
            </div>
            <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
              <Shield className="h-8 w-8 text-spotify-green mb-2" />
              <h3 className="text-white font-semibold">Safe & Compliant</h3>
              <p className="text-gray-400 text-sm mt-1">
                Rate-limited and secure
              </p>
            </div>
            <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
              <Music className="h-8 w-8 text-spotify-green mb-2" />
              <h3 className="text-white font-semibold">For Artists</h3>
              <p className="text-gray-400 text-sm mt-1">
                Built by artists, for artists
              </p>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={handleSpotifyLogin}
            className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-full text-white bg-spotify-green hover:bg-green-600 transition-colors"
          >
            <Music className="mr-2 h-5 w-5" />
            Continue with Spotify
          </button>

          {/* Terms */}
          <p className="text-center text-xs text-gray-500">
            By continuing, you agree to Follow Swarm's Terms of Service and Privacy Policy
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-gray-500 text-sm">
        © 2025 Follow Swarm. Not affiliated with Spotify.
      </footer>
    </div>
  );
};

export default Login;