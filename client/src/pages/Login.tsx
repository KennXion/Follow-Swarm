import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Music, Users, TrendingUp, Shield, Star, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { authAPI } from '../services/api';

/**
 * Particle interface for swarm animation
 * Creates an organic, living particle field that follows the mouse cursor
 */
interface Particle {
  id: number;
  x: number;           // Current x position
  y: number;           // Current y position
  targetX: number;     // Target x position (mouse position)
  targetY: number;     // Target y position (mouse position)
  vx: number;          // Velocity x component
  vy: number;          // Velocity y component
  size: number;        // Particle size in pixels
  opacity: number;     // Current opacity (0-1)
  color: string;       // Particle color (shades of Spotify green)
  delay: number;       // Animation delay for staggered effects
  orbitRadius: number; // Unique orbit distance for each particle (40-120px)
  lifespan: number;    // Total lifespan in frames (600-1800 frames @ 60fps = 10-30 seconds)
  age: number;         // Current age in frames
  fadeIn: boolean;     // Whether particle is in fade-in phase
}

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
  const [particles, setParticles] = useState<Particle[]>([]);
  const [swarmIntensity, setSwarmIntensity] = useState(0); // Track how many particles are near mouse
  const animationRef = useRef<number>();
  const nextParticleId = useRef(100); // For unique IDs
  
  /**
   * Creates a new particle with randomized properties
   * Used for initial spawn and continuous respawning to maintain particle density
   */
  const createParticle = (x?: number, y?: number) => {
    const sizeCategory = Math.random();
    let size;
    if (sizeCategory < 0.6) {
      size = Math.random() * 1.5 + 0.5; // 60% tiny particles
    } else if (sizeCategory < 0.9) {
      size = Math.random() * 2 + 2; // 30% medium particles
    } else {
      size = Math.random() * 2 + 4; // 10% larger particles
    }
    
    return {
      id: nextParticleId.current++,
      x: x ?? Math.random() * window.innerWidth,
      y: y ?? Math.random() * window.innerHeight,
      targetX: x ?? Math.random() * window.innerWidth,
      targetY: y ?? Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: size,
      opacity: 0,
      color: ['#1DB954', '#1ed760', '#21e065', '#32d674'][Math.floor(Math.random() * 4)],
      delay: 0,
      orbitRadius: 40 + Math.random() * 80,
      lifespan: 600 + Math.random() * 1200, // 10-30 seconds
      age: 0,
      fadeIn: true
    };
  };

  // Initialize particles
  useEffect(() => {
    const particleCount = 100; // Many more particles for richer effect
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      // Randomly distribute particles across the entire screen
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      
      // More varied sizes - some tiny, some larger
      const sizeCategory = Math.random();
      let size;
      if (sizeCategory < 0.6) {
        size = Math.random() * 1.5 + 0.5; // 60% tiny particles (0.5-2px)
      } else if (sizeCategory < 0.9) {
        size = Math.random() * 2 + 2; // 30% medium particles (2-4px)
      } else {
        size = Math.random() * 2 + 4; // 10% larger particles (4-6px)
      }
      
      newParticles.push({
        id: i,
        x: x,
        y: y,
        targetX: x, // Initially target their own position
        targetY: y,
        vx: (Math.random() - 0.5) * 0.5, // Small initial velocity
        vy: (Math.random() - 0.5) * 0.5,
        size: size,
        opacity: 0, // Start invisible, will fade in
        color: ['#1DB954', '#1ed760', '#21e065', '#32d674'][Math.floor(Math.random() * 4)],
        delay: Math.random() * 2000, // Random delays for organic feel
        orbitRadius: 40 + Math.random() * 80, // Random orbit distance between 40-120px
        lifespan: 600 + Math.random() * 1200, // Live for 10-30 seconds (at 60fps)
        age: Math.random() * 600, // Start at random ages for variety
        fadeIn: true // Start by fading in
      });
    }
    
    setParticles(newParticles);
  }, []);

  /**
   * Main animation loop - handles particle physics, lifecycle, and respawning
   * Features:
   * - Magnetic attraction within 350px range
   * - Orbital motion at 40-120px from cursor
   * - Particle lifecycle with fade in/out
   * - Smart respawning in empty screen areas
   * - Dynamic swarm intensity tracking
   */
  useEffect(() => {
    const animate = () => {
      let nearbyParticles = 0; // Count particles near mouse for intensity calculation
      let newParticlesToAdd: Particle[] = [];
      
      setParticles(prevParticles => {
        // Process existing particles
        const updatedParticles = prevParticles.map(particle => {
          // Age the particle
          const newAge = particle.age + 1;
          // Calculate distance to target (mouse position)
          const dx = particle.targetX - particle.x;
          const dy = particle.targetY - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Physics parameters
          const magneticRange = 350; // Initial magnetic range
          const stickyRange = 450; // Once attracted, stay connected at this larger range
          const orbitRadius = particle.orbitRadius; // Use each particle's unique orbit distance
          const orbitSpeed = 0.025; // Speed of orbital rotation
          const attractionForce = 0.025; // Much stronger magnetic pull
          const friction = 0.96; // Slightly less friction for faster response
          const maxSpeed = 7; // Higher max speed for quicker gathering
          
          // Check if particle is already attracted (sticky behavior)
          const wasAttracted = distance < magneticRange * 1.2; // Remember if particle was recently attracted
          const effectiveRange = wasAttracted ? stickyRange : magneticRange;
          
          let forceX = 0;
          let forceY = 0;
          
          // Apply forces if within effective range (sticky or magnetic)
          if (distance < effectiveRange) {
            // Calculate normalized direction
            const dirX = dx / (distance + 0.001);
            const dirY = dy / (distance + 0.001);
            
            if (distance > orbitRadius * 1.2) {
              // Stronger attraction toward the mouse with acceleration curve
              const distanceRatio = (distance - orbitRadius) / (effectiveRange - orbitRadius);
              const attractionStrength = attractionForce * (1 - distanceRatio * 0.3); // Even stronger pull
              forceX += dirX * attractionStrength;
              forceY += dirY * attractionStrength;
            } else if (distance > orbitRadius && distance <= orbitRadius * 1.2) {
              // Gentle attraction to maintain orbit
              forceX += dirX * attractionForce * 0.1;
              forceY += dirY * attractionForce * 0.1;
            } else if (distance < orbitRadius * 0.6) {
              // Gentle repulsion if too close
              forceX -= dirX * attractionForce * 0.2;
              forceY -= dirY * attractionForce * 0.2;
            }
            
            // Strong orbital motion to keep particles circling
            if (distance > orbitRadius * 0.5 && distance < orbitRadius * 1.5) {
              // Calculate perpendicular direction for orbit
              const orbitDirX = -dirY;
              const orbitDirY = dirX;
              // Vary orbit speed based on particle size (smaller particles orbit faster)
              const sizeSpeedFactor = 1 + (1 - particle.size / 6) * 0.5;
              // Stronger orbital force to maintain connection
              const orbitForce = orbitSpeed * sizeSpeedFactor * (1.2 - Math.abs(distance - orbitRadius) / (orbitRadius * 2));
              forceX += orbitDirX * orbitForce;
              forceY += orbitDirY * orbitForce;
            }
          } else {
            // Gentle wandering when outside magnetic range
            forceX = (Math.random() - 0.5) * 0.01;
            forceY = (Math.random() - 0.5) * 0.01;
          }
          
          // Update velocity
          let newVx = (particle.vx + forceX) * friction;
          let newVy = (particle.vy + forceY) * friction;
          
          // Limit maximum speed
          const speed = Math.sqrt(newVx * newVx + newVy * newVy);
          if (speed > maxSpeed) {
            newVx = (newVx / speed) * maxSpeed;
            newVy = (newVy / speed) * maxSpeed;
          }
          
          // Update position
          const newX = particle.x + newVx;
          const newY = particle.y + newVy;
          
          // Keep particles within screen bounds
          const padding = 20;
          let boundedX = newX;
          let boundedY = newY;
          
          // Bounce off edges
          if (newX < padding || newX > window.innerWidth - padding) {
            newVx *= -0.5;
            boundedX = Math.max(padding, Math.min(window.innerWidth - padding, newX));
          }
          if (newY < padding || newY > window.innerHeight - padding) {
            newVy *= -0.5;
            boundedY = Math.max(padding, Math.min(window.innerHeight - padding, newY));
          }
          
          // Update opacity based on distance and particle size
          // Smaller particles are more transparent, larger ones more visible
          const sizeOpacityFactor = Math.min(particle.size / 4, 1);
          
          // Once attracted, maintain higher opacity (sticky visual effect)
          const isAttracted = distance < effectiveRange;
          
          // Count particles in swarm for intensity calculation
          if (distance < 150) {
            nearbyParticles++;
          }
          
          // Brightness increases dramatically as particles get closer to mouse
          let distanceFactor;
          if (isAttracted) {
            // Map distance to opacity: closer = brighter
            const normalizedDistance = Math.max(0, Math.min(1, distance / 200)); // Normalize to 0-1 within 200px
            distanceFactor = 1 - normalizedDistance * 0.6; // Opacity from 1.0 (at mouse) to 0.4 (at 200px)
            distanceFactor = Math.max(0.4, Math.min(1, distanceFactor)); // Clamp between 0.4 and 1
          } else {
            distanceFactor = 0.25; // Lower base opacity outside range
          }
          
          // Handle lifecycle opacity (fade in/out)
          let lifecycleOpacity = 1;
          if (particle.fadeIn && newAge < 60) {
            // Fade in during first second
            lifecycleOpacity = newAge / 60;
          } else if (newAge > particle.lifespan - 60) {
            // Fade out during last second
            lifecycleOpacity = (particle.lifespan - newAge) / 60;
          }
          
          const targetOpacity = distanceFactor * sizeOpacityFactor * lifecycleOpacity;
          const newOpacity = particle.opacity + (targetOpacity - particle.opacity) * 0.08;
          
          return {
            ...particle,
            x: boundedX,
            y: boundedY,
            vx: newVx,
            vy: newVy,
            opacity: newOpacity,
            age: newAge,
            fadeIn: particle.fadeIn && newAge < 60
          };
        });
        
        // Filter out dead particles and check for sparse areas
        const aliveParticles = updatedParticles.filter(p => p.age < p.lifespan);
        
        // Check screen coverage and spawn new particles in empty areas
        const gridSize = 200; // Check 200x200px grid cells
        const gridCols = Math.ceil(window.innerWidth / gridSize);
        const gridRows = Math.ceil(window.innerHeight / gridSize);
        
        // Count particles in each grid cell
        const grid = Array(gridRows).fill(null).map(() => Array(gridCols).fill(0));
        aliveParticles.forEach(p => {
          const col = Math.floor(p.x / gridSize);
          const row = Math.floor(p.y / gridSize);
          if (row >= 0 && row < gridRows && col >= 0 && col < gridCols) {
            grid[row][col]++;
          }
        });
        
        // Spawn new particles in empty cells (maintain ~100 particles total)
        const targetParticleCount = 100;
        const particlesToSpawn = Math.max(0, targetParticleCount - aliveParticles.length);
        
        for (let i = 0; i < particlesToSpawn; i++) {
          // Find emptiest grid cell
          let minCount = Infinity;
          let emptyCell = { row: 0, col: 0 };
          
          for (let row = 0; row < gridRows; row++) {
            for (let col = 0; col < gridCols; col++) {
              if (grid[row][col] < minCount) {
                minCount = grid[row][col];
                emptyCell = { row, col };
              }
            }
          }
          
          // Spawn particle in the emptiest cell
          const x = emptyCell.col * gridSize + Math.random() * gridSize;
          const y = emptyCell.row * gridSize + Math.random() * gridSize;
          newParticlesToAdd.push(createParticle(x, y));
          
          // Update grid count
          grid[emptyCell.row][emptyCell.col]++;
        }
        
        return [...aliveParticles, ...newParticlesToAdd];
      });
      
      // Update swarm intensity based on nearby particle count
      setSwarmIntensity(prevIntensity => {
        const targetIntensity = nearbyParticles / 100; // Normalize to 0-1 based on max particles
        return prevIntensity + (targetIntensity - prevIntensity) * 0.1; // Smooth transition
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [createParticle]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      // Update particle targets to mouse position (no randomness needed)
      setParticles(prevParticles => 
        prevParticles.map(particle => ({
          ...particle,
          targetX: e.clientX,
          targetY: e.clientY
        }))
      );
      
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
        {/* Dynamic mouse glow that responds to swarm size */}
        <div 
          className="absolute inset-0 transition-all duration-500"
          style={{
            background: `radial-gradient(circle ${200 + swarmIntensity * 150}px at ${mousePosition.x}px ${mousePosition.y}px, #1DB954 0%, transparent 100%)`,
            opacity: 0.1 + swarmIntensity * 0.15 // Glow gets brighter with more particles (10% to 25% opacity)
          }}
        />
        {/* Secondary glow layer for depth when swarm is dense */}
        {swarmIntensity > 0.3 && (
          <div 
            className="absolute inset-0 transition-all duration-700"
            style={{
              background: `radial-gradient(circle ${150 + swarmIntensity * 100}px at ${mousePosition.x}px ${mousePosition.y}px, #21e065 0%, transparent 100%)`,
              opacity: swarmIntensity * 0.1 // Very subtle secondary glow
            }}
          />
        )}
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"%3E%3Cpath d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%25" height="100%25" fill="url(%23grid)"/%3E%3C/svg%3E")'
          }}
        />
      </div>

      {/* Swarm Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => {
          // Enhanced glow based on opacity/brightness
          const glowIntensity = particle.opacity;
          const glowSize = particle.size * (2 + glowIntensity * 3); // Bigger glow when brighter
          
          return (
            <div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                left: `${particle.x}px`,
                top: `${particle.y}px`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: particle.color,
                opacity: particle.opacity,
                boxShadow: `0 0 ${glowSize}px ${particle.color}, 0 0 ${glowSize * 0.5}px ${particle.color}`,
                filter: glowIntensity > 0.7 ? 'brightness(1.3)' : 'none',
                transform: `translate(-50%, -50%)`,
                transition: 'opacity 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease',
              }}
            />
          );
        })}
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