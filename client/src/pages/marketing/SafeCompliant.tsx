import { Link } from 'react-router-dom';
import { 
  Shield, 
  Lock, 
  CheckCircle, 
  AlertTriangle, 
  Key, 
  ArrowRight,
  ShieldCheck,
  Eye,
  Server,
  Fingerprint,
  Award
} from 'lucide-react';

/**
 * SafeCompliant Marketing Page
 * 
 * Highlights security, privacy, and compliance features of Follow Swarm.
 * Shows enterprise-grade protection, rate limiting, and regulatory compliance.
 * Uses green/emerald gradient theme for trust and security.
 */
const SafeCompliant = () => {
  // Enterprise-grade security features
  const securityFeatures = [
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description: 'All data is encrypted using industry-standard AES-256-GCM encryption'
    },
    {
      icon: Key,
      title: 'OAuth 2.0 Authentication',
      description: 'Secure authentication directly through Spotify\'s official OAuth system'
    },
    {
      icon: Shield,
      title: 'Rate Limiting Protection',
      description: 'Intelligent rate limiting to ensure compliance with Spotify\'s API guidelines'
    },
    {
      icon: Server,
      title: 'Secure Infrastructure',
      description: 'Hosted on enterprise-grade servers with 99.9% uptime guarantee'
    },
    {
      icon: Eye,
      title: 'Privacy First',
      description: 'We never store your password or share your data with third parties'
    },
    {
      icon: Fingerprint,
      title: 'Two-Factor Authentication',
      description: 'Optional 2FA for an extra layer of account security'
    }
  ];

  // International compliance standards and certifications
  const compliance = [
    {
      title: 'GDPR Compliant',
      description: 'Full compliance with European data protection regulations',
      icon: '🇪🇺'
    },
    {
      title: 'CCPA Ready',
      description: 'Adherent to California Consumer Privacy Act requirements',
      icon: '🇺🇸'
    },
    {
      title: 'SOC 2 Type II',
      description: 'Audited and certified for security, availability, and confidentiality',
      icon: '🏆'
    },
    {
      title: 'ISO 27001',
      description: 'International standard for information security management',
      icon: '🌍'
    }
  ];

  // Trust metrics and security statistics
  const trustBadges = [
    { label: 'Users Protected', value: '100K+' },
    { label: 'Security Score', value: 'A+' },
    { label: 'Uptime', value: '99.9%' },
    { label: 'Data Breaches', value: '0' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-emerald-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20" />
          <div className="absolute top-32 right-32 w-72 h-72 bg-green-500 rounded-full blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-32 left-32 w-96 h-96 bg-emerald-500 rounded-full blur-3xl opacity-20 animate-pulse" />
        </div>

        {/* Security Pattern Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative z-10 container mx-auto px-6 py-20">
          <Link to="/login" className="inline-flex items-center text-white/70 hover:text-white mb-8 transition-colors">
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            Back to Login
          </Link>

          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl mb-6">
              <Shield className="h-8 w-8 text-white" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Safe &
              <span className="block bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Compliant
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Your security is our priority. Built with enterprise-grade protection and full compliance with platform guidelines.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/login"
                className="group px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-full hover:shadow-2xl hover:shadow-green-500/30 transition-all duration-300 transform hover:scale-105"
              >
                <span className="flex items-center justify-center">
                  Get Protected
                  <Shield className="ml-2 h-5 w-5 group-hover:animate-pulse" />
                </span>
              </Link>
              <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300">
                Security Audit
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {trustBadges.map((badge, index) => (
              <div 
                key={index}
                className="text-center"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                  {badge.value}
                </div>
                <div className="text-gray-400">{badge.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Enterprise-Grade Security
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Multiple layers of protection keeping your data safe
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {securityFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Globally Compliant
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Meeting and exceeding international standards
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {compliance.map((item, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 text-center"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rate Limiting Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <AlertTriangle className="h-12 w-12 text-yellow-400 mb-4" />
                <h3 className="text-3xl font-bold text-white mb-4">
                  Smart Rate Limiting
                </h3>
                <p className="text-gray-300 mb-6">
                  Our intelligent rate limiting system ensures you never exceed Spotify's API limits, keeping your account safe and compliant.
                </p>
                <ul className="space-y-3">
                  {[
                    'Automatic request throttling',
                    'Real-time limit monitoring',
                    'Queue management system',
                    'Predictive limit warnings'
                  ].map((item, index) => (
                    <li key={index} className="flex items-center text-gray-300">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-8 border border-white/10">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Hourly Limit</span>
                      <span className="text-green-400 font-semibold">75/100</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: '75%' }} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Daily Limit</span>
                      <span className="text-green-400 font-semibold">450/1000</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: '45%' }} />
                    </div>
                  </div>
                </div>
                <ShieldCheck className="absolute -top-4 -right-4 h-8 w-8 text-green-400 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Audit Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Independently Verified
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Regular security audits by leading cybersecurity firms
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Award className="h-8 w-8 text-yellow-400 mr-3" />
                  <div>
                    <h3 className="text-xl font-semibold text-white">Latest Security Audit</h3>
                    <p className="text-gray-400">Performed by CyberSec Labs</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-400">PASSED</div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { label: 'Vulnerabilities Found', value: '0', status: 'safe' },
                  { label: 'Code Quality Score', value: '98/100', status: 'excellent' },
                  { label: 'Compliance Rating', value: 'AAA', status: 'perfect' }
                ].map((item, index) => (
                  <div key={index} className="bg-white/5 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white mb-1">{item.value}</div>
                    <div className="text-sm text-gray-400">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-3xl p-12 border border-white/10">
            <Lock className="h-12 w-12 text-emerald-400 mx-auto mb-4 animate-pulse" />
            <h2 className="text-4xl font-bold text-white mb-4">
              Your Security is Guaranteed
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands who trust us with their growth
            </p>
            <Link 
              to="/login"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-full hover:shadow-2xl hover:shadow-green-500/30 transition-all duration-300 transform hover:scale-105"
            >
              Start Secure Growth
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SafeCompliant;