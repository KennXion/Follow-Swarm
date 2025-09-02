import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Target, 
  Brain, 
  BarChart3, 
  Zap, 
  ArrowRight,
  CheckCircle,
  Sparkles,
  Filter,
  Search,
  Activity,
  Database
} from 'lucide-react';

/**
 * SmartTargeting Marketing Page
 * 
 * Showcases AI-powered artist recommendation and targeting features.
 * Demonstrates performance metrics, process visualization, and real-time matching.
 * Uses blue/cyan gradient theme for technology-focused appeal.
 */
const SmartTargeting = () => {
  // AI-powered features for smart artist targeting
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Recommendations',
      description: 'Our machine learning algorithms analyze listening patterns to suggest the most relevant artists'
    },
    {
      icon: Filter,
      title: 'Genre Matching',
      description: 'Connect with artists in your specific genre and sub-genres for maximum relevance'
    },
    {
      icon: Activity,
      title: 'Engagement Analytics',
      description: 'Track engagement rates and optimize your targeting strategy in real-time'
    },
    {
      icon: Database,
      title: 'Data-Driven Insights',
      description: 'Access detailed analytics about your target audience and growth patterns'
    }
  ];

  // Performance metrics demonstrating effectiveness
  const metrics = [
    { label: 'Targeting Accuracy', value: '94%', color: 'from-blue-500 to-cyan-500' },
    { label: 'Engagement Rate', value: '78%', color: 'from-green-500 to-emerald-500' },
    { label: 'Growth Speed', value: '3.2x', color: 'from-purple-500 to-pink-500' },
    { label: 'ROI Increase', value: '250%', color: 'from-yellow-500 to-orange-500' }
  ];

  // Four-step process for smart targeting
  const process = [
    {
      title: 'Analyze Your Profile',
      description: 'We examine your music style, genre, and current audience demographics',
      icon: Search
    },
    {
      title: 'Identify Opportunities',
      description: 'Our AI identifies artists with similar audiences and high engagement potential',
      icon: Target
    },
    {
      title: 'Smart Matching',
      description: 'Connect with artists most likely to reciprocate and engage with your content',
      icon: Brain
    },
    {
      title: 'Track & Optimize',
      description: 'Monitor results and continuously refine your targeting strategy',
      icon: BarChart3
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-black to-cyan-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20" />
          <div className="absolute top-40 left-40 w-72 h-72 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-40 right-40 w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-20 animate-pulse" />
        </div>

        {/* Animated Grid Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>

        <div className="relative z-10 container mx-auto px-6 py-20">
          <Link to="/login" className="inline-flex items-center text-white/70 hover:text-white mb-8 transition-colors">
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            Back to Login
          </Link>

          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-6">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Smart
              <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Targeting
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Leverage cutting-edge AI technology to identify and connect with the most relevant artists for exponential growth.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/login"
                className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-full hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105"
              >
                <span className="flex items-center justify-center">
                  Start Targeting
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300">
                View Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Performance Metrics
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Real results from artists using our smart targeting system
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {metrics.map((metric, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`text-3xl font-bold bg-gradient-to-r ${metric.color} bg-clip-text text-transparent mb-2`}>
                  {metric.value}
                </div>
                <div className="text-gray-400">{metric.label}</div>
                <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${metric.color} rounded-full`}
                    style={{ width: metric.value }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Intelligent Features
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Advanced technology that puts you ahead of the competition
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group flex gap-6 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex-shrink-0">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How Smart Targeting Works
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Our four-step process to maximize your growth potential
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-6">
              {process.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={index}
                    className="relative group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {index < process.length - 1 && (
                      <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-blue-500 to-transparent" />
                    )}
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                      <p className="text-sm text-gray-400">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Visual Demo Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-3xl font-bold text-white mb-4">
                  See It In Action
                </h3>
                <p className="text-gray-300 mb-6">
                  Watch how our AI analyzes your profile and identifies the perfect artists to connect with, maximizing your growth potential.
                </p>
                <ul className="space-y-3">
                  {[
                    'Real-time artist matching',
                    'Predictive engagement scoring',
                    'Genre and style analysis',
                    'Audience overlap detection'
                  ].map((item, index) => (
                    <li key={index} className="flex items-center text-gray-300">
                      <CheckCircle className="h-5 w-5 text-cyan-400 mr-3" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-8 border border-white/10">
                  <div className="space-y-4">
                    <div className="h-4 bg-white/10 rounded-full animate-pulse" />
                    <div className="h-4 bg-white/10 rounded-full animate-pulse" style={{ width: '80%' }} />
                    <div className="h-4 bg-white/10 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="h-20 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-xl animate-pulse" />
                    <div className="h-20 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl animate-pulse" />
                  </div>
                </div>
                <Sparkles className="absolute -top-4 -right-4 h-8 w-8 text-yellow-400 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-3xl p-12 border border-white/10">
            <Target className="h-12 w-12 text-cyan-400 mx-auto mb-4 animate-pulse" />
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Target Smarter?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Let AI find your perfect artist connections
            </p>
            <Link 
              to="/login"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-full hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105"
            >
              Activate Smart Targeting
              <Zap className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SmartTargeting;