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
jest.mock('../src/database/redis', () => ({
  client: {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    incr: jest.fn().mockResolvedValue(1),
    zadd: jest.fn().mockResolvedValue(1),
    zrem: jest.fn().mockResolvedValue(1),
    zrange: jest.fn().mockResolvedValue([]),
    quit: jest.fn().mockResolvedValue('OK'),
  },
  connect: jest.fn(),
  disconnect: jest.fn().mockResolvedValue(true),
  cacheToken: jest.fn().mockResolvedValue('OK'),
  getCachedToken: jest.fn().mockResolvedValue(null),
  incrementRateLimit: jest.fn().mockResolvedValue(1),
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