import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  Ban,
  CheckCircle,
  AlertCircle,
  Mail,
  Calendar,
  Activity,
  TrendingUp,
  UserPlus,
  Download,
  Eye,
  X
} from 'lucide-react';

/**
 * UserManagement Component
 * 
 * Admin interface for managing users, viewing profiles, and controlling access.
 * Includes search, filtering, bulk actions, and user detail modals.
 */
const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [sortBy, setSortBy] = useState('created_desc');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Mock data - replace with actual API calls
  useEffect(() => {
    setUsers([
      {
        id: '1',
        displayName: 'John Doe',
        email: 'john.doe@example.com',
        spotifyId: 'spotify_123',
        plan: 'premium',
        status: 'active',
        followers: 1234,
        following: 567,
        totalFollows: 15420,
        joinedDate: '2024-01-15',
        lastActive: '2 hours ago',
        country: 'United States',
        isVerified: true
      },
      {
        id: '2',
        displayName: 'Jane Smith',
        email: 'jane.smith@example.com',
        spotifyId: 'spotify_456',
        plan: 'free',
        status: 'active',
        followers: 890,
        following: 234,
        totalFollows: 8920,
        joinedDate: '2024-02-20',
        lastActive: '5 minutes ago',
        country: 'United Kingdom',
        isVerified: false
      },
      {
        id: '3',
        displayName: 'Mike Wilson',
        email: 'mike.wilson@example.com',
        spotifyId: 'spotify_789',
        plan: 'pro',
        status: 'suspended',
        followers: 2456,
        following: 890,
        totalFollows: 32100,
        joinedDate: '2023-12-10',
        lastActive: '1 day ago',
        country: 'Canada',
        isVerified: true
      },
      {
        id: '4',
        displayName: 'Sarah Jones',
        email: 'sarah.jones@example.com',
        spotifyId: 'spotify_012',
        plan: 'premium',
        status: 'active',
        followers: 3210,
        following: 1234,
        totalFollows: 45600,
        joinedDate: '2023-11-05',
        lastActive: '1 hour ago',
        country: 'Australia',
        isVerified: true
      },
      {
        id: '5',
        displayName: 'Alex Brown',
        email: 'alex.brown@example.com',
        spotifyId: 'spotify_345',
        plan: 'free',
        status: 'inactive',
        followers: 456,
        following: 123,
        totalFollows: 2340,
        joinedDate: '2024-03-01',
        lastActive: '1 week ago',
        country: 'Germany',
        isVerified: false
      }
    ]);
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    const matchesPlan = filterPlan === 'all' || user.plan === filterPlan;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const selectAllUsers = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
            <Ban className="h-3 w-3 mr-1" />
            Suspended
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
            <AlertCircle className="h-3 w-3 mr-1" />
            Inactive
          </span>
        );
      default:
        return null;
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors = {
      free: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      pro: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      premium: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[plan as keyof typeof colors]}`}>
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 mt-1">Manage user accounts and permissions</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all flex items-center">
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{users.length}</div>
              <div className="text-sm text-gray-400">Total Users</div>
            </div>
            <Users className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">
                {users.filter(u => u.status === 'active').length}
              </div>
              <div className="text-sm text-gray-400">Active</div>
            </div>
            <Activity className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">
                {users.filter(u => u.plan === 'premium').length}
              </div>
              <div className="text-sm text-gray-400">Premium</div>
            </div>
            <Shield className="h-8 w-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">
                {users.filter(u => u.isVerified).length}
              </div>
              <div className="text-sm text-gray-400">Verified</div>
            </div>
            <CheckCircle className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-gray-900 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-red-600"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="px-4 py-2 bg-gray-900 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-red-600"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="premium">Premium</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-gray-900 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-red-600"
            >
              <option value="created_desc">Newest First</option>
              <option value="created_asc">Oldest First</option>
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <div className="mt-4 flex items-center justify-between p-3 bg-red-600/10 border border-red-600/30 rounded-xl">
            <span className="text-sm text-white">
              {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors">
                Send Email
              </button>
              <button className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors">
                Suspend
              </button>
              <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors">
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50 border-b border-gray-700">
              <tr>
                <th className="p-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={selectAllUsers}
                    className="rounded text-red-600 focus:ring-red-600"
                  />
                </th>
                <th className="p-4 text-left text-xs font-semibold text-gray-400 uppercase">User</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-400 uppercase">Plan</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-400 uppercase">Activity</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-400 uppercase">Joined</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-900/30 transition-colors">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="rounded text-red-600 focus:ring-red-600"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-semibold">
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <div className="flex items-center">
                          <span className="text-white font-medium">{user.displayName}</span>
                          {user.isVerified && (
                            <CheckCircle className="h-4 w-4 text-blue-400 ml-1" />
                          )}
                        </div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="p-4">
                    {getPlanBadge(user.plan)}
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <div className="text-white">{user.totalFollows.toLocaleString()} follows</div>
                      <div className="text-gray-400">{user.lastActive}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-400">
                      {new Date(user.joinedDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                        className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4 text-gray-400" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors">
                        <Edit className="h-4 w-4 text-gray-400" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </button>
                      <button className="p-1.5 hover:bg-red-600/20 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing 1 to {filteredUsers.length} of {users.length} users
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors">
              Previous
            </button>
            <button className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm">
              1
            </button>
            <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors">
              2
            </button>
            <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors">
              3
            </button>
            <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">User Details</h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {/* User details content would go here */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-2xl font-bold">
                    {selectedUser.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{selectedUser.displayName}</h3>
                    <p className="text-gray-400">{selectedUser.email}</p>
                  </div>
                </div>
                {/* Add more user details here */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;