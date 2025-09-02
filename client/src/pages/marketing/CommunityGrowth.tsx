import { Link } from 'react-router-dom';
import { 
  Users, 
  Globe, 
 
  Star, 
 
  ArrowRight,
  Sparkles,
  UserPlus,
  MessageCircle,
  Share2
} from 'lucide-react';

/**
 * CommunityGrowth Marketing Page
 * 
 * Landing page showcasing the community growth features of Follow Swarm.
 * Highlights global artist connections, testimonials, and growth statistics.
 * Uses purple/pink gradient theme for visual appeal.
 */
const CommunityGrowth = () => {
  // Platform statistics to showcase reach and impact
  const stats = [
    { value: '10M+', label: 'Artists Connected' },
    { value: '150+', label: 'Countries' },
    { value: '500K+', label: 'Daily Interactions' },
    { value: '98%', label: 'Satisfaction Rate' }
  ];

  // Key benefits of using the community growth feature
  const benefits = [
    {
      icon: UserPlus,
      title: 'Organic Growth',
      description: 'Build genuine connections with artists who share your musical vision'
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Connect with artists from every corner of the world'
    },
    {
      icon: MessageCircle,
      title: 'Engagement Boost',
      description: 'Increase your visibility and engagement within the Spotify ecosystem'
    },
    {
      icon: Share2,
      title: 'Network Effects',
      description: 'Leverage the power of mutual connections to expand your reach'
    }
  ];

  // Artist testimonials for social proof
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Indie Artist',
      image: '🎤',
      quote: 'Follow Swarm helped me connect with amazing artists worldwide. My monthly listeners grew by 300%!'
    },
    {
      name: 'Mike Chen',
      role: 'Producer',
      image: '🎧',
      quote: 'The community connections I\'ve made through this platform have been invaluable for collaborations.'
    },
    {
      name: 'Lisa Rodriguez',
      role: 'Singer-Songwriter',
      image: '🎸',
      quote: 'Finally, a platform that understands the importance of artist-to-artist connections.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20" />
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500 rounded-full blur-3xl opacity-20 animate-pulse" />
        </div>

        <div className="relative z-10 container mx-auto px-6 py-20">
          <Link to="/login" className="inline-flex items-center text-white/70 hover:text-white mb-8 transition-colors">
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            Back to Login
          </Link>

          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-6">
              <Users className="h-8 w-8 text-white" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Community
              <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Growth
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join a thriving ecosystem of artists supporting artists. Build meaningful connections that propel your music career forward.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/login"
                className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 transform hover:scale-105"
              >
                <span className="flex items-center justify-center">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="text-center"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Why Artists Choose Us
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Discover the benefits of joining our growing community
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{benefit.title}</h3>
                  <p className="text-gray-400">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Three simple steps to grow your artist network
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {[
                { step: '01', title: 'Connect Your Spotify', desc: 'Link your Spotify artist account securely' },
                { step: '02', title: 'Discover Artists', desc: 'Find artists that match your style and genre' },
                { step: '03', title: 'Grow Together', desc: 'Build mutual connections and watch your audience expand' }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-6 group">
                  <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-2xl font-bold text-white group-hover:scale-110 transition-transform">
                    {item.step}
                  </div>
                  <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 group-hover:bg-white/10 transition-all">
                    <h3 className="text-xl font-semibold text-white mb-1">{item.title}</h3>
                    <p className="text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Artist Success Stories
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Hear from artists who've transformed their careers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center mb-4">
                  <div className="text-4xl mr-3">{testimonial.image}</div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 italic">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-3xl p-12 border border-white/10">
            <Sparkles className="h-12 w-12 text-yellow-400 mx-auto mb-4 animate-pulse" />
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Grow Your Community?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of artists building meaningful connections
            </p>
            <Link 
              to="/login"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 transform hover:scale-105"
            >
              Start Growing Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CommunityGrowth;