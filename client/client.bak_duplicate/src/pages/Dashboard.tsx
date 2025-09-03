import { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Activity,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Line, Bar } from 'recharts';
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
      changeType: 'positive'
    },
    {
      title: 'Completed',
      value: stats?.summary.completed || 0,
      icon: TrendingUp,
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Pending',
      value: stats?.summary.pending || 0,
      icon: Clock,
      change: '5',
      changeType: 'neutral'
    },
    {
      title: 'Success Rate',
      value: stats?.summary.total ? 
        `${Math.round((stats.summary.completed / stats.summary.total) * 100)}%` : '0%',
      icon: Activity,
      change: '+2%',
      changeType: 'positive'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-1">Track your follow activity and performance</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spotify-green focus:border-transparent"
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
            <div key={stat.title} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className="bg-spotify-green bg-opacity-10 p-3 rounded-lg">
                  <Icon className="h-6 w-6 text-spotify-green" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                {stat.changeType === 'positive' ? (
                  <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                ) : stat.changeType === 'negative' ? (
                  <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                ) : null}
                <span className={
                  stat.changeType === 'positive' ? 'text-green-500' :
                  stat.changeType === 'negative' ? 'text-red-500' :
                  'text-gray-500'
                }>
                  {stat.change}
                </span>
                <span className="text-gray-500 ml-2">vs last period</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rate Limits */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Rate Limits</h3>
        <div className="space-y-4">
          {stats?.limits && Object.entries(stats.limits).map(([key, limit]) => (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1">
                <span className="capitalize text-gray-600">{key}</span>
                <span className="text-gray-900 font-medium">
                  {limit.remaining} / {limit.limit === Infinity ? '∞' : limit.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-spotify-green h-2 rounded-full transition-all"
                  style={{
                    width: limit.limit === Infinity ? '100%' : 
                      `${Math.max(0, (limit.remaining / limit.limit) * 100)}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Follow Activity</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          {/* Chart would go here - using placeholder for now */}
          <p>Activity chart visualization</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;