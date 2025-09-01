import { Link } from 'react-router-dom';
import { 
  Zap, 
  Timer, 
  Gauge, 
  Rocket, 
  FastForward, 
  ArrowRight,
  CheckCircle,
  Sparkles,
  Activity,
  TrendingUp,
  Clock,
  Play,
  BarChart,
  Cpu
} from 'lucide-react';

/**
 * LightningFast Marketing Page
 * 
 * Demonstrates the speed and efficiency of the automated follow system.
 * Shows performance metrics, speed comparisons, and real-time execution.
 * Uses yellow/orange gradient theme for energy and speed.
 */
const LightningFast = () => {
  // Speed and performance metrics
  const speedMetrics = [
    {
      metric: 'Processing Speed',
      value: '0.3s',
      description: 'Average follow request time',
      icon: Timer
    },
    {
      metric: 'Batch Processing',
      value: '1000+',
      description: 'Artists per minute',
      icon: FastForward
    },
    {
      metric: 'Queue Time',
      value: '<1min',
      description: 'From request to execution',
      icon: Clock
    },
    {
      metric: 'Uptime',
      value: '99.9%',
      description: 'System availability',
      icon: Activity
    }
  ];

  // Features optimized for maximum performance
  const features = [
    {
      title: 'Parallel Processing',
      description: 'Multiple requests processed simultaneously for maximum efficiency',
      icon: Cpu,
      stat: '10x faster'
    },
    {
      title: 'Smart Queue Management',
      description: 'Intelligent prioritization ensures optimal throughput',
      icon: BarChart,
      stat: '0 downtime'
    },
    {
      title: 'Auto-Scaling Infrastructure',
      description: 'Resources automatically adjust to demand',
      icon: TrendingUp,
      stat: 'Unlimited scale'
    },
    {
      title: 'Real-Time Execution',
      description: 'See results as they happen with live updates',
      icon: Activity,
      stat: 'Live tracking'
    }
  ];

  // Real-time execution timeline showing processing steps
  const timeline = [
    { time: '0s', event: 'Request initiated', active: true },
    { time: '0.1s', event: 'Artist validation', active: true },
    { time: '0.2s', event: 'Queue optimization', active: true },
    { time: '0.3s', event: 'API call executed', active: false },
    { time: '0.4s', event: 'Result confirmed', active: false }
  ];

  // Speed comparison with other methods
  const comparisons = [
    { method: 'Follow Swarm', time: '0.3s', bar: 100 },
    { method: 'Manual Following', time: '30s', bar: 10 },
    { method: 'Other Tools', time: '5s', bar: 60 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-black to-orange-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20" />
          <div className="absolute top-20 left-1/2 w-72 h-72 bg-yellow-500 rounded-full blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-20 right-1/3 w-96 h-96 bg-orange-500 rounded-full blur-3xl opacity-20 animate-pulse" />
        </div>

        {/* Speed Lines Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(251, 191, 36, 0.1) 50px, rgba(251, 191, 36, 0.1) 51px)`,
            animation: 'slide 2s linear infinite'
          }} />
        </div>

        <div className="relative z-10 container mx-auto px-6 py-20">
          <Link to="/login" className="inline-flex items-center text-white/70 hover:text-white mb-8 transition-colors">
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            Back to Login
          </Link>

          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl mb-6 animate-pulse">
              <Zap className="h-8 w-8 text-white" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Lightning
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Fast
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Automated follow system that works at the speed of light. Watch your network grow in real-time.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/login"
                className="group px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-full hover:shadow-2xl hover:shadow-yellow-500/30 transition-all duration-300 transform hover:scale-105"
              >
                <span className="flex items-center justify-center">
                  Accelerate Now
                  <Zap className="ml-2 h-5 w-5 group-hover:animate-bounce" />
                </span>
              </Link>
              <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300">
                Speed Test
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Speed Metrics Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Blazing Fast Performance
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Numbers that speak for themselves
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {speedMetrics.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 text-center"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Icon className="h-8 w-8 text-yellow-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">{item.value}</div>
                  <div className="text-sm font-semibold text-yellow-400 mb-1">{item.metric}</div>
                  <div className="text-xs text-gray-400">{item.description}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Speed Comparison Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Speed Comparison
              </h2>
              <p className="text-xl text-gray-400">
                See how we stack up against the competition
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
              <div className="space-y-6">
                {comparisons.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold">{item.method}</span>
                      <span className="text-yellow-400 font-bold">{item.time}</span>
                    </div>
                    <div className="h-8 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gray-600'
                        }`}
                        style={{ 
                          width: `${item.bar}%`,
                          animationDelay: `${index * 200}ms`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Gauge className="h-8 w-8 text-yellow-400 mx-auto mb-2 animate-spin-slow" />
                <p className="text-sm text-gray-400">Up to 100x faster than manual following</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Built for Speed
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Every feature optimized for maximum performance
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                        <span className="text-sm font-bold text-yellow-400">{feature.stat}</span>
                      </div>
                      <p className="text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Real-Time Timeline Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Real-Time Execution
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Watch your follows happen in milliseconds
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
              <div className="space-y-4">
                {timeline.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className={`w-20 text-right font-mono text-sm ${item.active ? 'text-yellow-400' : 'text-gray-500'}`}>
                      {item.time}
                    </div>
                    <div className={`w-4 h-4 rounded-full ${item.active ? 'bg-yellow-400 animate-pulse' : 'bg-gray-600'}`} />
                    <div className={`flex-1 ${item.active ? 'text-white' : 'text-gray-500'}`}>
                      {item.event}
                    </div>
                    {item.active && (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-center">
                <Play className="h-6 w-6 text-yellow-400 mr-2" />
                <span className="text-gray-400">Processing in progress...</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rocket Animation Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-3xl border border-white/10 p-12 text-center">
            <Rocket className="h-16 w-16 text-yellow-400 mx-auto mb-6 animate-bounce" />
            <h3 className="text-3xl font-bold text-white mb-4">
              Ready for Takeoff?
            </h3>
            <p className="text-xl text-gray-300 mb-6 max-w-2xl mx-auto">
              Your growth shouldn't wait. Start following at lightning speed today.
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
              {['Instant Setup', 'No Delays', 'Fast Results'].map((item, index) => (
                <div key={index} className="flex items-center justify-center text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-1" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
            <Link 
              to="/login"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-full hover:shadow-2xl hover:shadow-yellow-500/30 transition-all duration-300 transform hover:scale-105"
            >
              Launch Now
              <Rocket className="ml-2 h-5 w-5 rotate-45" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Sparkles className="h-12 w-12 text-yellow-400 mx-auto mb-4 animate-pulse" />
            <h2 className="text-4xl font-bold text-white mb-4">
              Speed is Everything
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Don't let slow growth hold you back
            </p>
            <Link 
              to="/login"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-full hover:shadow-2xl hover:shadow-yellow-500/30 transition-all duration-300 transform hover:scale-105"
            >
              Get Lightning Fast
              <FastForward className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes slide {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(50px);
          }
        }
        
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default LightningFast;