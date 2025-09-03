/**
 * Database Module Tests
 * 
 * Note: Database is mocked in setup.js, so these tests verify
 * the mock implementation behavior that other tests rely on.
 */

const db = require('../src/database/index');

describe('Database Module (Mocked)', () => {
  beforeEach(() => {
    // Clear all mock function calls
    jest.clearAllMocks();
  });
  
  describe('Core Methods', () => {
    it('should have connect method', async () => {
      expect(db.connect).toBeDefined();
      expect(typeof db.connect).toBe('function');
      
      const result = await db.connect();
      expect(result).toBe(true);
    });
    
    it('should have disconnect method', async () => {
      expect(db.disconnect).toBeDefined();
      expect(typeof db.disconnect).toBe('function');
      
      const result = await db.disconnect();
      expect(result).toBe(true);
    });
    
    it('should have query method', async () => {
      expect(db.query).toBeDefined();
      expect(typeof db.query).toBe('function');
      
      const result = await db.query('SELECT * FROM test', []);
      expect(result).toHaveProperty('rows');
      expect(Array.isArray(result.rows)).toBe(true);
    });
  });
  
  describe('Query Mocking', () => {
    it('should return user data for user queries', async () => {
      // First insert a user using the mock
      const user = await db.insert('users', { 
        spotify_id: 'test_user_123',
        email: 'test@example.com' 
      });
      
      expect(user).toHaveProperty('id');
      expect(user.spotify_id).toBe('test_user_123');
      
      // Now query for that user
      const result = await db.query('SELECT * FROM users WHERE id = $1', [user.id]);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual(user);
    });
    
    it('should return empty rows for non-existent data', async () => {
      const result = await db.query('SELECT * FROM users WHERE id = $1', [999999]);
      expect(result.rows).toHaveLength(0);
    });
    
    it('should handle COUNT queries', async () => {
      const result = await db.query('SELECT COUNT(*) FROM users', []);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toHaveProperty('count');
    });
    
    it('should handle follow count queries for rate limiting', async () => {
      // Without rate limit flag
      const result1 = await db.query('SELECT COUNT(*) FROM follows WHERE user_id = $1', ['user123']);
      expect(result1.rows[0].count).toBe('0');
      
      // With rate limit flag
      global.__testRateLimit = { 'user123': true };
      const result2 = await db.query('SELECT COUNT(*) FROM follows WHERE user_id = $1', ['user123']);
      expect(result2.rows[0].count).toBe('35');
      
      // Clean up
      delete global.__testRateLimit;
    });
  });
  
  describe('CRUD Operations', () => {
    it('should insert records', async () => {
      const record = await db.insert('users', {
        spotify_id: 'insert_test',
        email: 'insert@test.com',
        display_name: 'Insert Test'
      });
      
      expect(record).toHaveProperty('id');
      expect(record.spotify_id).toBe('insert_test');
      expect(record.email).toBe('insert@test.com');
    });
    
    it('should update records', async () => {
      const result = await db.update('users', 1, { display_name: 'Updated' });
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toHaveProperty('id', 1);
    });
    
    it('should delete records', async () => {
      // Insert a record first
      const user = await db.insert('users', { spotify_id: 'delete_test' });
      
      // Delete it
      const result = await db.delete('users', user.id);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toHaveProperty('id', user.id);
      
      // Verify it's gone
      const checkResult = await db.findOne('users', { id: user.id });
      expect(checkResult).toBeNull();
    });
    
    it('should find records by criteria', async () => {
      // Insert a record
      const user = await db.insert('users', {
        spotify_id: 'find_test',
        email: 'find@test.com'
      });
      
      // Find it
      const found = await db.findOne('users', { id: user.id });
      expect(found).toEqual(user);
      
      // Find non-existent
      const notFound = await db.findOne('users', { id: 999999 });
      expect(notFound).toBeNull();
    });
    
    it('should find records by ID', async () => {
      // Insert a record
      const user = await db.insert('users', {
        spotify_id: 'findbyid_test',
        email: 'findbyid@test.com'
      });
      
      // Find it by ID
      const found = await db.findById('users', user.id);
      expect(found).toEqual(user);
      
      // Find non-existent
      const notFound = await db.findById('users', 999999);
      expect(notFound).toBeNull();
    });
  });
  
  describe('Mock Verification', () => {
    it('should track method calls', async () => {
      await db.connect();
      expect(db.connect).toHaveBeenCalledTimes(1);
      
      await db.query('SELECT 1', []);
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith('SELECT 1', []);
      
      await db.disconnect();
      expect(db.disconnect).toHaveBeenCalledTimes(1);
    });
  });
});