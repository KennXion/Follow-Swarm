import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Music, Users, TrendingUp, Shield, Star, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { authAPI } from '../services/api';

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [honeypot, setHoneypot] = useState(''); // Bot trap field
  const [pageLoadTime] = useState(Date.now()); // Track page load time
  const [interactions, setInteractions] = useState({
    mouseEvents: 0,
    keyboardEvents: 0,
    focusEvents: 0
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      // Track mouse events for bot detection
      setInteractions(prev => ({ ...prev, mouseEvents: prev.mouseEvents + 1 }));
    };
    
    const handleKeyPress = () => {
      // Track keyboard events for bot detection
      setInteractions(prev => ({ ...prev, keyboardEvents: prev.keyboardEvents + 1 }));
    };
    
    const handleFocus = () => {
      // Track focus events for bot detection
      setInteractions(prev => ({ ...prev, focusEvents: prev.focusEvents + 1 }));
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keypress', handleKeyPress);
    window.addEventListener('focus', handleFocus);
    
    // Send page load time to backend
    sessionStorage.setItem('pageLoadTime', pageLoadTime.toString());
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keypress', handleKeyPress);
      window.removeEventListener('focus', handleFocus);
    };
  }, [pageLoadTime]);

  const handleSpotifyLogin = () => {
    // Check honeypot field (if filled, it's likely a bot)
    if (honeypot) {
      console.warn('Bot detected via honeypot');
      return;
    }
    
    // Check if interaction time is too fast (likely a bot)
    const timeSinceLoad = Date.now() - pageLoadTime;
    if (timeSinceLoad < 1000) {
      console.warn('Signup too fast, possible bot');
      return;
    }
    
    // Store behavior metrics for backend validation
    sessionStorage.setItem('signupMetrics', JSON.stringify({
      timeSinceLoad,
      ...interactions
    }));
    
    setIsLoading(true);
    authAPI.spotifyLogin();
  };

  const features = [
    {
      icon: Users,
      title: 'Community Growth',
      description: 'Connect with artists worldwide',
      color: 'from-purple-500 to-pink-500',
      link: '/features/community-growth'
    },
    {
      icon: TrendingUp,
      title: 'Smart Targeting',
      description: 'AI-powered artist suggestions',
      color: 'from-blue-500 to-cyan-500',
      link: '/features/smart-targeting'
    },
    {
      icon: Shield,
      title: 'Safe & Compliant',
      description: 'Rate-limited and secure',
      color: 'from-green-500 to-emerald-500',
      link: '/features/safe-compliant'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Automated follow system',
      color: 'from-yellow-500 to-orange-500',
      link: '/features/lightning-fast'
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, #1DB954 0%, transparent 50%)`
          }}
        />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"%3E%3Cpath d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%25" height="100%25" fill="url(%23grid)"/%3E%3C/svg%3E")'
          }}
        />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 bg-spotify-green rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 20}s`
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 animate-slide-down">
          <div className="flex items-center justify-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-spotify-green rounded-full blur-xl opacity-60 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-spotify-green to-green-600 rounded-full p-3">
                <Music className="h-8 w-8 text-white" />
              </div>
            </div>
            <span className="text-3xl font-bold text-white">Follow Swarm</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-5xl w-full">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Side - Hero Text */}
              <div className="text-center lg:text-left space-y-6 animate-fade-in">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-spotify-green/20 border border-spotify-green/30 text-spotify-green text-sm font-medium mb-4">
                  <Star className="h-4 w-4 mr-2" />
                  #1 Spotify Growth Platform
                </div>
                
                <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                  Grow Your
                  <span className="block bg-gradient-to-r from-spotify-green to-green-400 bg-clip-text text-transparent">
                    Spotify Following
                  </span>
                </h1>
                
                <p className="text-xl text-gray-300 max-w-md mx-auto lg:mx-0">
                  Join thousands of artists using Follow Swarm to expand their reach and connect with new fans worldwide.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  {/* Honeypot field - invisible to humans, visible to bots */}
                  <input
                    type="text"
                    name="website"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                    style={{
                      position: 'absolute',
                      left: '-9999px',
                      width: '1px',
                      height: '1px',
                      margin: '-1px',
                      padding: '0',
                      border: '0',
                      clip: 'rect(0 0 0 0)',
                      overflow: 'hidden'
                    }}
                    aria-hidden="true"
                  />
                  
                  <button
                    onClick={handleSpotifyLogin}
                    disabled={isLoading}
                    className="group relative px-8 py-4 bg-spotify-green hover:bg-spotify-dark-green text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-spotify-green/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="flex items-center justify-center">
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Music className="mr-2 h-5 w-5" />
                          Continue with Spotify
                          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                  </button>
                </div>

                {/* Stats */}
                <div className="flex gap-8 justify-center lg:justify-start pt-6">
                  <div>
                    <div className="text-2xl font-bold text-white">10K+</div>
                    <div className="text-sm text-gray-400">Active Artists</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">500K+</div>
                    <div className="text-sm text-gray-400">Follows Exchanged</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">4.9★</div>
                    <div className="text-sm text-gray-400">User Rating</div>
                  </div>
                </div>
              </div>

              {/* Right Side - Features Grid */}
              <div className="grid grid-cols-2 gap-4 animate-slide-up">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <Link
                      key={index}
                      to={feature.link}
                      className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer block"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />
                      <div className="relative">
                        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                        <p className="text-gray-400 text-sm">{feature.description}</p>
                      </div>
                      <Sparkles className="absolute top-4 right-4 h-4 w-4 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center space-y-4 animate-fade-in">
          <p className="text-xs text-gray-500">
            By continuing, you agree to Follow Swarm's Terms of Service and Privacy Policy
          </p>
          <p className="text-xs text-gray-600">
            © 2025 Follow Swarm. Not affiliated with Spotify AB.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Login;