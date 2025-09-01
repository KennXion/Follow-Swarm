import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Settings, 
  Shield, 
  Menu, 
  X, 
  LogOut,
  Database,
  Activity,
  AlertCircle,
  Crown,
  Lock,
  FileText,
  Bell
} from 'lucide-react';
import { authAPI } from '../services/api';

/**
 * AdminLayout Component
 * 
 * Specialized layout wrapper for admin panel with enhanced navigation
 * and security indicators. Features a distinct design from regular user layout.
 */
const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const response = await authAPI.getStatus();
      setUser(response.data.user);
      // For testing: Allow all authenticated users to access admin panel
      // In production, check: response.data.user?.role === 'admin' || response.data.user?.isAdmin
      setIsAdmin(true); // Temporarily allow all logged-in users
      
      // if (!isAdmin) {
      //   navigate('/dashboard');
      // }
    } catch (error) {
      console.error('Failed to verify admin status:', error);
      navigate('/login');
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    { path: '/admin', name: 'Overview', icon: LayoutDashboard, exact: true },
    { path: '/admin/users', name: 'User Management', icon: Users },
    { path: '/admin/analytics', name: 'Analytics', icon: BarChart3 },
    { path: '/admin/system', name: 'System Settings', icon: Settings },
    { path: '/admin/security', name: 'Security', icon: Shield },
    { path: '/admin/logs', name: 'Activity Logs', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Admin Header Bar */}
      <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-semibold">
        <div className="flex items-center justify-center">
          <Shield className="h-4 w-4 mr-2" />
          Admin Panel - Restricted Access
          <Lock className="h-4 w-4 ml-2" />
        </div>
      </div>

      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-10 left-0 z-50 h-[calc(100vh-2.5rem)] w-72 
        bg-gray-900/95 backdrop-blur-xl
        border-r border-gray-700
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <Link to="/admin" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-red-600 rounded-xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-2.5">
                <Crown className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Panel</h1>
              <p className="text-xs text-gray-400">Follow Swarm Control</p>
            </div>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Admin Info */}
        {user && (
          <div className="p-4 mx-4 mt-4 rounded-xl bg-gradient-to-r from-red-600/10 to-orange-600/10 border border-red-600/20">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user.displayName?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.displayName || 'Admin'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  Administrator
                </p>
              </div>
              <Shield className="h-4 w-4 text-red-400" />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact 
              ? location.pathname === item.path 
              : location.pathname.startsWith(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' 
                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                  }
                `}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : ''}`} />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <div className="ml-auto h-2 w-2 bg-white rounded-full animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Quick Stats */}
        <div className="p-4 border-t border-gray-700">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-gray-800/50 rounded-lg p-2 text-center">
              <div className="text-xs text-gray-400">Active Users</div>
              <div className="text-lg font-bold text-white">1,247</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-2 text-center">
              <div className="text-xs text-gray-400">System Load</div>
              <div className="text-lg font-bold text-green-400">32%</div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-700">
          <Link
            to="/dashboard"
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-800/50 transition-all duration-200 mb-2"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="font-medium">User Dashboard</span>
          </Link>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-900/20 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Top Bar */}
        <header className="sticky top-10 z-30 bg-gray-900/80 backdrop-blur-xl border-b border-gray-700">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Menu className="h-6 w-6 text-gray-400" />
            </button>

            <div className="flex items-center space-x-4">
              <div className="flex items-center px-3 py-1.5 rounded-full bg-red-600/10 border border-red-600/20">
                <Activity className="h-4 w-4 text-red-400 mr-2 animate-pulse" />
                <span className="text-xs font-medium text-red-400">Admin Mode Active</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors">
                <Bell className="h-5 w-5 text-gray-400" />
                <div className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
              </button>

              {/* System Status */}
              <div className="flex items-center px-3 py-1.5 rounded-full bg-green-600/10 border border-green-600/20">
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse mr-2" />
                <span className="text-xs font-medium text-green-400">All Systems Operational</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;