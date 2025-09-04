const adminUsersController = require('../../src/controllers/admin/adminUsers.controller');
const userQueries = require('../../src/controllers/admin/userQueries');
const db = require('../../src/database');
const encryption = require('../../src/utils/encryption');

// Mock dependencies
jest.mock('../../src/controllers/admin/userQueries', () => ({
  getUsers: jest.fn(),
  getUserCount: jest.fn(),
  getUserById: jest.fn(),
  updateUser: jest.fn(),
  softDeleteUser: jest.fn(),
  getUserActivity: jest.fn()
}));
jest.mock('../../src/database');
jest.mock('../../src/utils/encryption');

describe('Admin Users Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      params: {},
      query: {},
      body: {},
      user: { id: 'admin-123', role: 'admin' }
    };
    
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('getUsers', () => {
    it('should return paginated users with default params', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@test.com', display_name: 'User 1' },
        { id: '2', email: 'user2@test.com', display_name: 'User 2' }
      ];
      const mockTotal = 50;

      userQueries.getUsers.mockResolvedValue(mockUsers);
      userQueries.getUserCount.mockResolvedValue(mockTotal);

      await adminUsersController.getUsers(mockReq, mockRes);

      expect(userQueries.getUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        search: undefined,
        status: undefined
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        users: mockUsers,
        pagination: {
          total: mockTotal,
          page: 1,
          pages: 3,
          limit: 20
        }
      });
    });

    it('should handle search and status filters', async () => {
      mockReq.query = {
        page: '2',
        limit: '10',
        search: 'john',
        status: 'active'
      };

      userQueries.getUsers.mockResolvedValue([]);
      userQueries.getUserCount.mockResolvedValue(0);

      await adminUsersController.getUsers(mockReq, mockRes);

      expect(userQueries.getUsers).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        search: 'john',
        status: 'active'
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      userQueries.getUsers.mockRejectedValue(error);

      await adminUsersController.getUsers(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to fetch users'
      });
    });
  });

  describe('getUserById', () => {
    it('should return user details with decrypted tokens', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@test.com',
        encrypted_access_token: 'encrypted_token'
      };

      mockReq.params.id = 'user-123';
      userQueries.getUserById.mockResolvedValue(mockUser);
      encryption.decrypt.mockReturnValue('decrypted_token');

      await adminUsersController.getUserById(mockReq, mockRes);

      expect(userQueries.getUserById).toHaveBeenCalledWith('user-123');
      expect(encryption.decrypt).toHaveBeenCalledWith('encrypted_token');
      expect(mockRes.json).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'user@test.com',
        encrypted_access_token: '[ENCRYPTED]',
        has_access_token: true
      });
    });

    it('should handle user not found', async () => {
      mockReq.params.id = 'nonexistent';
      userQueries.getUserById.mockResolvedValue(null);

      await adminUsersController.getUserById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'User not found'
      });
    });

    it('should handle decryption errors gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        encrypted_access_token: 'bad_token'
      };

      mockReq.params.id = 'user-123';
      userQueries.getUserById.mockResolvedValue(mockUser);
      encryption.decrypt.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      await adminUsersController.getUserById(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        id: 'user-123',
        encrypted_access_token: '[ENCRYPTED]',
        has_access_token: false
      });
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      mockReq.params.id = 'user-123';
      mockReq.body = {
        subscription_tier: 'premium',
        status: 'active'
      };

      const updatedUser = {
        id: 'user-123',
        subscription_tier: 'premium',
        status: 'active'
      };

      userQueries.updateUser.mockResolvedValue(updatedUser);

      await adminUsersController.updateUser(mockReq, mockRes);

      expect(userQueries.updateUser).toHaveBeenCalledWith('user-123', {
        subscription_tier: 'premium',
        status: 'active'
      });
      expect(mockRes.json).toHaveBeenCalledWith(updatedUser);
    });

    it('should handle update errors', async () => {
      mockReq.params.id = 'user-123';
      mockReq.body = { status: 'invalid' };

      userQueries.updateUser.mockRejectedValue(new Error('Update failed'));

      await adminUsersController.updateUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to update user'
      });
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user', async () => {
      mockReq.params.id = 'user-123';

      userQueries.softDeleteUser.mockResolvedValue({ id: 'user-123', deleted_at: '2024-01-01' });

      await adminUsersController.deleteUser(mockReq, mockRes);

      expect(userQueries.softDeleteUser).toHaveBeenCalledWith('user-123');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'User soft deleted successfully'
      });
    });

    it('should handle deletion errors', async () => {
      mockReq.params.id = 'user-123';
      
      userQueries.softDeleteUser.mockRejectedValue(new Error('Delete failed'));

      await adminUsersController.deleteUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to delete user'
      });
    });
  });

  describe('getUserActivity', () => {
    it('should return user activity data', async () => {
      mockReq.params.id = 'user-123';
      
      const mockActivity = {
        follows: [{ created_at: '2024-01-01', target_artist_id: 'artist-1' }],
        sessions: [{ created_at: '2024-01-01', duration_minutes: 30 }]
      };

      userQueries.getUserActivity.mockResolvedValue(mockActivity);

      await adminUsersController.getUserActivity(mockReq, mockRes);

      expect(userQueries.getUserActivity).toHaveBeenCalledWith('user-123');
      expect(mockRes.json).toHaveBeenCalledWith(mockActivity);
    });

    it('should handle activity fetch errors', async () => {
      mockReq.params.id = 'user-123';
      
      userQueries.getUserActivity.mockRejectedValue(new Error('Activity fetch failed'));

      await adminUsersController.getUserActivity(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to fetch user activity'
      });
    });
  });
});