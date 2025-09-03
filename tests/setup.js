// Test setup file
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use random available port for tests
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/spotify_swarm_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.ENCRYPTION_KEY = 'test_encryption_key_32_chars_xxx';
process.env.SESSION_SECRET = 'test_session_secret';

// Import cleanup helper
const { setupTestLifecycle } = require('./helpers/cleanup');
setupTestLifecycle();

// Mock console to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock Redis in test environment
// Provides a complete mock implementation to avoid Redis dependency in tests
// Handles both direct client methods and module-level convenience methods
jest.mock('../src/database/redis', () => {
  const mockClient = {
    set: jest.fn((key, value, ...args) => {
      // Handle EX option
      if (args[0] === 'EX') {
        return Promise.resolve('OK');
      }
      return Promise.resolve('OK');
    }),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    incr: jest.fn().mockResolvedValue(1),
    zadd: jest.fn().mockResolvedValue(1),
    zrem: jest.fn().mockResolvedValue(1),
    zrange: jest.fn().mockResolvedValue([]),
    hset: jest.fn().mockResolvedValue(1),
    hget: jest.fn().mockResolvedValue(null),
    hgetall: jest.fn().mockResolvedValue({}),
    lpush: jest.fn().mockResolvedValue(1),
    lrange: jest.fn().mockResolvedValue([]),
    quit: jest.fn().mockResolvedValue('OK'),
    ping: jest.fn().mockResolvedValue('PONG'),
  };
  
  const mockRedis = {
    client: mockClient,
    publisher: {
      publish: jest.fn().mockResolvedValue(1),
    },
    subscriber: {
      subscribe: jest.fn().mockResolvedValue('OK'),
      on: jest.fn(),
    },
    connect: jest.fn().mockReturnValue(mockClient),
    disconnect: jest.fn().mockResolvedValue(true),
    cacheToken: jest.fn().mockResolvedValue('OK'),
    getCachedToken: jest.fn().mockResolvedValue(null),
    incrementRateLimit: jest.fn().mockResolvedValue(1),
    set: jest.fn((...args) => mockClient.set(...args)),
    get: jest.fn((key) => mockClient.get(key)),
    del: jest.fn((key) => mockClient.del(key)),
  };
  
  return mockRedis;
});

// Mock Database in test environment
// Reset these for each test file
global.mockUsers = global.mockUsers || new Map();
global.mockFollows = global.mockFollows || new Map();
global.mockQueueJobs = global.mockQueueJobs || new Map();
global.mockUserId = global.mockUserId || 1;
global.mockFollowId = global.mockFollowId || 1;
global.mockJobId = global.mockJobId || 1;

const mockUsers = global.mockUsers;
const mockFollows = global.mockFollows;
const mockQueueJobs = global.mockQueueJobs;

jest.mock('../src/database', () => ({
  connect: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn().mockResolvedValue(true),
  healthCheck: jest.fn().mockResolvedValue({
    status: 'healthy',
    message: 'Database is responsive',
    responseTime: 10,
    poolStats: {
      totalCount: 10,
      idleCount: 5,
      waitingCount: 0
    },
    timestamp: new Date().toISOString()
  }),
  query: jest.fn().mockImplementation((sql, params) => {
    // Mock responses for common queries
    if (sql.includes('SELECT * FROM users WHERE id')) {
      const userId = params?.[0]?.toString(); // Convert to string
      const user = mockUsers.get(userId);
      return Promise.resolve({ rows: user ? [user] : [] });
    }
    // Mock follow count query for rate limiting
    if (sql.includes('COUNT') && sql.includes('follows')) {
      // Check if this is a rate limit test (looking for high follow count)
      const userId = params?.[0];
      // Return high count for rate limit testing
      if (global.__testRateLimit && global.__testRateLimit[userId]) {
        return Promise.resolve({ rows: [{ count: '35' }] });
      }
      // Count actual follows for the user
      const followCount = Array.from(mockFollows.values()).filter(
        follow => follow.follower_user_id === userId && follow.status === 'completed'
      ).length;
      return Promise.resolve({ rows: [{ count: String(followCount) }] });
    }
    if (sql.includes('COUNT')) {
      return Promise.resolve({ rows: [{ count: '10', total: 10 }] });
    }
    if (sql.includes('FROM follows') || (sql.includes('SELECT') && sql.includes('follows'))) {
      // Handle LEFT JOIN query from follow routes
      const userId = params?.[0];
      let userFollows = Array.from(mockFollows.values()).filter(
        follow => follow.follower_user_id === userId
      );
      
      // If status filter is provided (second parameter)
      if (params?.[1]) {
        userFollows = userFollows.filter(follow => follow.status === params[1]);
      }
      
      // Add artist_name field for LEFT JOIN queries
      if (sql.includes('LEFT JOIN')) {
        userFollows = userFollows.map(follow => ({
          ...follow,
          artist_name: `Artist ${follow.target_artist_id}`,
          spotify_data: null
        }));
      }
      
      return Promise.resolve({ rows: userFollows, rowCount: userFollows.length });
    }
    if (sql.includes('UPDATE users') && sql.includes('SET')) {
      // Extract the user ID from the WHERE clause
      const userId = params?.[params.length - 1]?.toString();
      const user = mockUsers.get(userId);
      if (user) {
        // Update the user in the mock store
        const updatedUser = { ...user };
        // Parse the SET clause to update fields
        if (sql.includes('subscription_plan')) {
          const planIndex = params.findIndex(p => ['free', 'pro', 'premium'].includes(p));
          if (planIndex !== -1) updatedUser.subscription_plan = params[planIndex];
        }
        if (sql.includes('status')) {
          const statusIndex = params.findIndex(p => ['active', 'inactive', 'suspended'].includes(p));
          if (statusIndex !== -1) updatedUser.status = params[statusIndex];
        }
        mockUsers.set(userId, updatedUser);
        return Promise.resolve({ rows: [updatedUser], rowCount: 1 });
      }
      return Promise.resolve({ rows: [], rowCount: 0 });
    }
    if (sql.includes('DELETE FROM users')) {
      const userId = params?.[0]?.toString();
      if (mockUsers.has(userId)) {
        mockUsers.delete(userId);
        return Promise.resolve({ rows: [], rowCount: 1 });
      }
      return Promise.resolve({ rows: [], rowCount: 0 });
    }
    // Handle analytics/admin queries
    if (sql.includes('DATE_TRUNC') || sql.includes('security_logs') || sql.includes('suspicious_ips')) {
      return Promise.resolve({ rows: [] });
    }
    return Promise.resolve({ rows: [] });
  }),
  insert: jest.fn().mockImplementation((table, data) => {
    if (table === 'users') {
      const id = global.mockUserId++;
      const record = { id: id.toString(), ...data }; // Store as string to match UUID format
      mockUsers.set(id.toString(), record);
      return Promise.resolve(record);
    } else if (table === 'follows') {
      const id = global.mockFollowId++;
      const record = { id: id.toString(), ...data };
      mockFollows.set(id.toString(), record);
      return Promise.resolve(record);
    } else if (table === 'queue_jobs') {
      const id = global.mockJobId++;
      const record = { id: id.toString(), ...data };
      mockQueueJobs.set(id.toString(), record);
      return Promise.resolve(record);
    }
    const id = global.mockUserId++;
    const record = { id: id.toString(), ...data };
    return Promise.resolve(record);
  }),
  update: jest.fn().mockImplementation((table, id, data) => {
    const idStr = id?.toString();
    if (table === 'queue_jobs' && mockQueueJobs.has(idStr)) {
      const job = mockQueueJobs.get(idStr);
      Object.assign(job, data);
      return Promise.resolve(job);
    }
    return Promise.resolve({ rows: [{ id: 1 }] });
  }),
  delete: jest.fn().mockImplementation((table, id) => {
    const idStr = id?.toString();
    if (table === 'users') {
      mockUsers.delete(idStr);
    } else if (table === 'follows') {
      mockFollows.delete(idStr);
    } else if (table === 'queue_jobs') {
      mockQueueJobs.delete(idStr);
    }
    return Promise.resolve({ rows: [{ id: idStr }] });
  }),
  get: jest.fn().mockResolvedValue(null),
  findOne: jest.fn().mockImplementation((table, criteria) => {
    if (table === 'users' && criteria.id) {
      return Promise.resolve(mockUsers.get(criteria.id?.toString()) || null);
    }
    if (table === 'queue_jobs') {
      // Find job by id and user_id
      if (criteria.id && criteria.user_id) {
        const job = mockQueueJobs.get(criteria.id);
        if (job && job.user_id === criteria.user_id) {
          return Promise.resolve(job);
        }
      }
      // Find job by id only
      if (criteria.id) {
        return Promise.resolve(mockQueueJobs.get(criteria.id) || null);
      }
    }
    return Promise.resolve(null);
  }),
  findById: jest.fn().mockImplementation((table, id) => {
    if (table === 'users') {
      return Promise.resolve(mockUsers.get(id) || null);
    }
    return Promise.resolve(null);
  }),
  pool: {
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn()
    })
  }
}));

// Mock Bot Protection Middleware
jest.mock('../src/middleware/botProtection', () => ({
  signupRateLimiter: (req, res, next) => next(),
  trackSignupBehavior: (req, res, next) => next(),
  checkSuspiciousIP: (req, res, next) => next(),
  detectBot: (req, res, next) => next(),
  oauthRateLimiter: (req, res, next) => next(),
  apiRateLimiter: (req, res, next) => next(),
  checkHoneypot: (req, res, next) => next(),
  verifySpotifyAccount: jest.fn().mockResolvedValue(0.1),
  analyzeSignupBehavior: jest.fn().mockReturnValue(0.1),
  logSuspiciousActivity: jest.fn().mockResolvedValue(undefined),
  initializeBotProtection: jest.fn().mockResolvedValue(undefined)
}));

// Mock Queue Manager in test environment
const mockQueueManager = {
  isInitialized: false,
  initialize: jest.fn().mockImplementation(function() {
    this.isInitialized = true;
    return Promise.resolve(true);
  }),
  shutdown: jest.fn().mockImplementation(function() {
    this.isInitialized = false;
    return Promise.resolve(true);
  }),
  addFollowJob: jest.fn().mockResolvedValue({ id: 'test-job-1', status: 'queued' }),
  addBatchFollowJobs: jest.fn().mockImplementation((userId, artistIds) => {
    // Return array of jobs matching the number of artistIds
    return Promise.resolve(
      artistIds.map((artistId, index) => ({
        id: `test-job-${index + 1}`,
        status: 'queued'
      }))
    );
  }),
  getUserJobs: jest.fn().mockResolvedValue([]),
  cancelUserJobs: jest.fn().mockImplementation((userId) => {
    // Find all pending/queued jobs for this user and cancel them
    const userJobs = Array.from(mockQueueJobs.values()).filter(
      job => job.user_id === userId && (job.status === 'queued' || job.status === 'scheduled')
    );
    
    // Mark them as cancelled
    userJobs.forEach(job => {
      job.status = 'cancelled';
    });
    
    return Promise.resolve(userJobs);
  }),
  getQueueStatus: jest.fn().mockResolvedValue({
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0
  }),
  pauseQueue: jest.fn().mockResolvedValue(true),
  cleanupOldJobs: jest.fn().mockResolvedValue({ removed: 0 }),
  queues: {
    follow: {
      add: jest.fn().mockResolvedValue({ id: 'test-job-1' }),
      pause: jest.fn().mockResolvedValue(true),
      resume: jest.fn().mockResolvedValue(true),
      clean: jest.fn().mockResolvedValue([]),
      close: jest.fn().mockResolvedValue(true),
    },
    analytics: {
      add: jest.fn().mockResolvedValue({ id: 'test-analytics-1' }),
      close: jest.fn().mockResolvedValue(true),
    },
    notification: {
      add: jest.fn().mockResolvedValue({ id: 'test-notification-1' }),
      close: jest.fn().mockResolvedValue(true),
    }
  }
};

// Set the mock object
jest.mock('../src/services/queueManager', () => mockQueueManager);