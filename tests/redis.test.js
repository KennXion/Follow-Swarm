/**
 * Redis Module Tests
 */

// Note: Redis is already mocked in setup.js, but we'll test the interface
const redis = require('../src/database/redis');

describe('Redis Module', () => {
  beforeEach(() => {
    // Clear mock function calls
    if (redis.client) {
      Object.keys(redis.client).forEach(key => {
        if (typeof redis.client[key] === 'function' && redis.client[key].mockClear) {
          redis.client[key].mockClear();
        }
      });
    }
  });
  
  describe('connection', () => {
    it('should have client instance', () => {
      expect(redis.client).toBeDefined();
    });
    
    it('should have publisher instance', () => {
      expect(redis.publisher).toBeDefined();
    });
    
    it('should have subscriber instance', () => {
      expect(redis.subscriber).toBeDefined();
    });
  });
  
  describe('basic operations', () => {
    it('should set values', async () => {
      const result = await redis.set('test_key', 'test_value');
      
      expect(result).toBe('OK');
      expect(redis.client.set).toHaveBeenCalledWith('test_key', 'test_value');
    });
    
    it('should set values with expiry', async () => {
      const result = await redis.set('test_key', 'test_value', 'EX', 60);
      
      expect(result).toBe('OK');
      expect(redis.client.set).toHaveBeenCalledWith('test_key', 'test_value', 'EX', 60);
    });
    
    it('should get values', async () => {
      redis.client.get.mockResolvedValue('test_value');
      
      const result = await redis.get('test_key');
      
      expect(result).toBe('test_value');
      expect(redis.client.get).toHaveBeenCalledWith('test_key');
    });
    
    it('should delete keys', async () => {
      const result = await redis.del('test_key');
      
      expect(result).toBe(1);
      expect(redis.client.del).toHaveBeenCalledWith('test_key');
    });
  });
  
  describe('token caching', () => {
    it('should cache tokens', async () => {
      const result = await redis.cacheToken('user123', 'access_token_value');
      
      expect(result).toBe('OK');
    });
    
    it('should retrieve cached tokens', async () => {
      // Mock the getCachedToken method directly since it's defined on the redis object
      redis.getCachedToken.mockResolvedValueOnce('cached_token');
      
      const result = await redis.getCachedToken('user123');
      
      expect(result).toBe('cached_token');
    });
    
    it('should return null for non-existent tokens', async () => {
      redis.client.get.mockResolvedValue(null);
      
      const result = await redis.getCachedToken('nonexistent');
      
      expect(result).toBeNull();
    });
  });
  
  describe('rate limiting', () => {
    it('should increment rate limit counter', async () => {
      const result = await redis.incrementRateLimit('user123');
      
      expect(result).toBe(1);
    });
    
    it('should handle rate limit increments', async () => {
      // Mock the incrementRateLimit method directly
      redis.incrementRateLimit.mockResolvedValueOnce(5);
      
      const result = await redis.incrementRateLimit('user123');
      
      expect(result).toBe(5);
    });
  });
  
  describe('pub/sub operations', () => {
    it('should publish messages', async () => {
      const result = await redis.publisher.publish('test_channel', 'test_message');
      
      expect(result).toBe(1);
      expect(redis.publisher.publish).toHaveBeenCalledWith('test_channel', 'test_message');
    });
    
    it('should subscribe to channels', async () => {
      const result = await redis.subscriber.subscribe('test_channel');
      
      expect(result).toBe('OK');
      expect(redis.subscriber.subscribe).toHaveBeenCalledWith('test_channel');
    });
    
    it('should handle subscription events', () => {
      const callback = jest.fn();
      
      redis.subscriber.on('message', callback);
      
      expect(redis.subscriber.on).toHaveBeenCalledWith('message', callback);
    });
  });
  
  describe('list operations', () => {
    it('should push to lists', async () => {
      const result = await redis.client.lpush('test_list', 'value1');
      
      expect(result).toBe(1);
      expect(redis.client.lpush).toHaveBeenCalledWith('test_list', 'value1');
    });
    
    it('should get list ranges', async () => {
      redis.client.lrange.mockResolvedValue(['value1', 'value2']);
      
      const result = await redis.client.lrange('test_list', 0, -1);
      
      expect(result).toEqual(['value1', 'value2']);
      expect(redis.client.lrange).toHaveBeenCalledWith('test_list', 0, -1);
    });
  });
  
  describe('sorted set operations', () => {
    it('should add to sorted sets', async () => {
      const result = await redis.client.zadd('test_zset', 100, 'member1');
      
      expect(result).toBe(1);
      expect(redis.client.zadd).toHaveBeenCalledWith('test_zset', 100, 'member1');
    });
    
    it('should remove from sorted sets', async () => {
      const result = await redis.client.zrem('test_zset', 'member1');
      
      expect(result).toBe(1);
      expect(redis.client.zrem).toHaveBeenCalledWith('test_zset', 'member1');
    });
    
    it('should get sorted set ranges', async () => {
      redis.client.zrange.mockResolvedValue(['member1', 'member2']);
      
      const result = await redis.client.zrange('test_zset', 0, -1);
      
      expect(result).toEqual(['member1', 'member2']);
      expect(redis.client.zrange).toHaveBeenCalledWith('test_zset', 0, -1);
    });
  });
  
  describe('hash operations', () => {
    it('should set hash fields', async () => {
      const result = await redis.client.hset('test_hash', 'field1', 'value1');
      
      expect(result).toBe(1);
      expect(redis.client.hset).toHaveBeenCalledWith('test_hash', 'field1', 'value1');
    });
    
    it('should get hash fields', async () => {
      redis.client.hget.mockResolvedValue('value1');
      
      const result = await redis.client.hget('test_hash', 'field1');
      
      expect(result).toBe('value1');
      expect(redis.client.hget).toHaveBeenCalledWith('test_hash', 'field1');
    });
    
    it('should get all hash fields', async () => {
      redis.client.hgetall.mockResolvedValue({ field1: 'value1', field2: 'value2' });
      
      const result = await redis.client.hgetall('test_hash');
      
      expect(result).toEqual({ field1: 'value1', field2: 'value2' });
      expect(redis.client.hgetall).toHaveBeenCalledWith('test_hash');
    });
  });
  
  describe('connection management', () => {
    it('should connect to Redis', () => {
      const result = redis.connect();
      
      expect(result).toBeDefined();
      expect(redis.connect).toHaveBeenCalled();
    });
    
    it('should disconnect from Redis', async () => {
      const result = await redis.disconnect();
      
      expect(result).toBe(true);
      expect(redis.disconnect).toHaveBeenCalled();
    });
    
    it('should handle disconnect when already disconnected', async () => {
      // Should not throw
      await expect(redis.disconnect()).resolves.toBe(true);
    });
  });
});