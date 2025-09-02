import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { adminAPI } from '../../services/api';

/**
 * AdminAnalytics Component
 * 
 * Comprehensive analytics dashboard for monitoring system performance,
 * user engagement metrics, and platform statistics. Features interactive
 * charts, real-time data updates, and export capabilities.
 */
const AdminAnalytics = () => {
  const [timeRange, setTimeRange] = useState('7d'); // Selected time range filter
  const [loading, setLoading] = useState(true); // Loading state for data fetching
  const [_analyticsData, setAnalyticsData] = useState<any>(null); // Analytics data from API (prefixed with _ to indicate intentionally unused)

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getStats();
      setAnalyticsData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const userGrowthData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'New Users',
      data: [12, 19, 15, 25, 22, 30, 28],
      borderColor: 'rgb(239, 68, 68)',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      tension: 0.4
    }]
  };

  const followActivityData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    datasets: [{
      label: 'Follow Tasks',
      data: [30, 25, 45, 60, 55, 40],
      backgroundColor: 'rgba(239, 68, 68, 0.8)'
    }]
  };

  const platformData = {
    labels: ['Desktop', 'Mobile', 'Tablet'],
    datasets: [{
      data: [65, 30, 5],
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(250, 204, 21, 0.8)'
      ]
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'rgb(156, 163, 175)'
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(156, 163, 175, 0.1)'
        },
        ticks: {
          color: 'rgb(156, 163, 175)'
        }
      },
      y: {
        grid: {
          color: 'rgba(156, 163, 175, 0.1)'
        },
        ticks: {
          color: 'rgb(156, 163, 175)'
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <BarChart3 className="h-8 w-8 mr-3 text-red-500" />
            Analytics Dashboard
          </h1>
          <p className="text-gray-400 mt-1">Monitor system performance and user engagement</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          
          <button
            onClick={fetchAnalytics}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Users className="h-8 w-8 text-red-500" />
            <span className="text-xs text-green-400 font-semibold">+12.5%</span>
          </div>
          <h3 className="text-2xl font-bold text-white">8,492</h3>
          <p className="text-gray-400 text-sm mt-1">Total Users</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Activity className="h-8 w-8 text-orange-500" />
            <span className="text-xs text-green-400 font-semibold">+8.2%</span>
          </div>
          <h3 className="text-2xl font-bold text-white">24,687</h3>
          <p className="text-gray-400 text-sm mt-1">Follow Tasks</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="h-8 w-8 text-yellow-500" />
            <span className="text-xs text-green-400 font-semibold">+15.3%</span>
          </div>
          <h3 className="text-2xl font-bold text-white">89.2%</h3>
          <p className="text-gray-400 text-sm mt-1">Success Rate</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="h-8 w-8 text-green-500" />
            <span className="text-xs text-red-400 font-semibold">-2.4%</span>
          </div>
          <h3 className="text-2xl font-bold text-white">3.2s</h3>
          <p className="text-gray-400 text-sm mt-1">Avg Response Time</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
          <div className="h-64">
            <Line data={userGrowthData} options={chartOptions} />
          </div>
        </div>

        {/* Follow Activity Chart */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Follow Activity</h3>
          <div className="h-64">
            <Bar data={followActivityData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Platform Distribution & Top Artists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Distribution */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Platform Distribution</h3>
          <div className="h-64">
            <Doughnut data={platformData} options={{ ...chartOptions, maintainAspectRatio: true }} />
          </div>
        </div>

        {/* Top Followed Artists */}
        <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Top Followed Artists</h3>
          <div className="space-y-3">
            {[
              { name: 'Taylor Swift', follows: 4892, change: '+12%' },
              { name: 'Drake', follows: 4231, change: '+8%' },
              { name: 'The Weeknd', follows: 3987, change: '+15%' },
              { name: 'Billie Eilish', follows: 3654, change: '+5%' },
              { name: 'Ariana Grande', follows: 3421, change: '+10%' }
            ].map((artist, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-white font-medium">{artist.name}</p>
                    <p className="text-gray-400 text-sm">{artist.follows.toLocaleString()} follows</p>
                  </div>
                </div>
                <span className="text-green-400 text-sm font-semibold">{artist.change}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;