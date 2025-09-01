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
jest.mock('../src/database', () => ({
  connect: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn().mockResolvedValue(true),
  query: jest.fn().mockResolvedValue({ rows: [] }),
  insert: jest.fn().mockImplementation((table, data) => 
    Promise.resolve({ id: Math.floor(Math.random() * 1000), ...data })
  ),
  update: jest.fn().mockResolvedValue({ rows: [{ id: 1 }] }),
  delete: jest.fn().mockResolvedValue({ rows: [{ id: 1 }] }),
  get: jest.fn().mockResolvedValue(null),
  pool: {
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn()
    })
  }
}));

// Mock Queue Manager in test environment
jest.mock('../src/services/queueManager', () => ({
  initialize: jest.fn().mockResolvedValue(true),
  shutdown: jest.fn().mockResolvedValue(true),
  addFollowJob: jest.fn().mockResolvedValue({ id: 'test-job-1', status: 'queued' }),
  addBatchFollowJobs: jest.fn().mockResolvedValue([
    { id: 'test-job-1', status: 'queued' },
    { id: 'test-job-2', status: 'queued' }
  ]),
  getUserJobs: jest.fn().mockResolvedValue([]),
  cancelUserJobs: jest.fn().mockResolvedValue([]),
  getQueueStatus: jest.fn().mockResolvedValue({
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0
  }),
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
}));