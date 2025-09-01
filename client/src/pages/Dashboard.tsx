import { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Activity,
  ArrowUp,
  ArrowDown,
  Zap,
  Target,
  Award,
  BarChart3
} from 'lucide-react';
import { followAPI } from '../services/api';

interface Stats {
  summary: {
    completed: number;
    pending: number;
    failed: number;
    total: number;
  };
  daily: Array<{
    date: string;
    count: number;
  }>;
  limits: {
    hourly: { count: number; limit: number; remaining: number };
    daily: { count: number; limit: number; remaining: number };
    monthly: { count: number; limit: number; remaining: number };
  };
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, limitsRes] = await Promise.all([
        followAPI.getStats(period),
        followAPI.getRateLimits()
      ]);
      
      setStats({
        ...statsRes.data.data,
        limits: limitsRes.data.data.limits
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spotify-green"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Follows',
      value: stats?.summary.total || 0,
      icon: Users,
      change: '+12%',
      changeType: 'positive',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Completed',
      value: stats?.summary.completed || 0,
      icon: TrendingUp,
      change: '+8%',
      changeType: 'positive',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Pending',
      value: stats?.summary.pending || 0,
      icon: Clock,
      change: '5',
      changeType: 'neutral',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      title: 'Success Rate',
      value: stats?.summary.total ? 
        `${Math.round((stats.summary.completed / stats.summary.total) * 100)}%` : '0%',
      icon: Activity,
      change: '+2%',
      changeType: 'positive',
      gradient: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track your follow activity and performance</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-spotify-green focus:border-transparent transition-colors"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.title} 
              className="group relative bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700/50 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 rounded-2xl transition-opacity duration-300`} />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex items-center text-sm">
                    {stat.changeType === 'positive' ? (
                      <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : stat.changeType === 'negative' ? (
                      <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                    ) : null}
                    <span className={
                      stat.changeType === 'positive' ? 'text-green-500 font-medium' :
                      stat.changeType === 'negative' ? 'text-red-500 font-medium' :
                      'text-gray-500 dark:text-gray-400 font-medium'
                    }>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rate Limits */}
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rate Limits</h3>
            <Zap className="h-5 w-5 text-spotify-green" />
          </div>
          <div className="space-y-4">
            {stats?.limits && Object.entries(stats.limits).map(([key, limit]) => {
              const percentage = limit.limit === Infinity ? 100 : 
                Math.max(0, (limit.remaining / limit.limit) * 100);
              const isLow = percentage < 20;
              
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="capitalize text-gray-600 dark:text-gray-400 font-medium">{key}</span>
                    <span className={`font-semibold ${isLow ? 'text-orange-500' : 'text-gray-900 dark:text-white'}`}>
                      {limit.remaining} / {limit.limit === Infinity ? '∞' : limit.limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLow ? 'bg-orange-500' : 'bg-gradient-to-r from-spotify-green to-green-400'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Metrics</h3>
            <Target className="h-5 w-5 text-spotify-green" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">This Week</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.summary.completed || 0}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Artists Followed</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Average</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.daily && stats.daily.length > 0 
                  ? Math.round(stats.daily.reduce((acc, d) => acc + d.count, 0) / stats.daily.length)
                  : 0}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Daily Follows</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Follow Activity</h3>
          <Activity className="h-5 w-5 text-spotify-green" />
        </div>
        <div className="h-64 flex items-center justify-center">
          {stats?.daily && stats.daily.length > 0 ? (
            <div className="w-full h-full flex items-end justify-between gap-2">
              {stats.daily.slice(-7).map((day, index) => {
                const maxCount = Math.max(...stats.daily.map(d => d.count), 1);
                const height = (day.count / maxCount) * 100;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center justify-end">
                    <div className="relative group w-full">
                      <div
                        className="w-full bg-gradient-to-t from-spotify-green to-green-400 rounded-t-lg transition-all duration-300 hover:from-spotify-dark-green hover:to-green-500"
                        style={{ height: `${height * 2}px` }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {day.count} follows
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No activity data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;