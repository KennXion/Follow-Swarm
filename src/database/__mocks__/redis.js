/**
 * Mock Redis client for testing
 */

class MockRedisClient {
  constructor() {
    this.data = new Map();
    this.client = this;
    this.subscriber = this;
    this.publisher = this;
  }

  connect() {
    return this;
  }

  async disconnect() {
    return Promise.resolve();
  }

  async get(key) {
    return this.data.get(key) || null;
  }

  async set(key, value, ...args) {
    this.data.set(key, value);
    // Handle EX (expire) option
    if (args[0] === 'EX' && args[1]) {
      setTimeout(() => this.data.delete(key), args[1] * 1000);
    }
    return 'OK';
  }

  async del(key) {
    return this.data.delete(key) ? 1 : 0;
  }

  async exists(key) {
    return this.data.has(key) ? 1 : 0;
  }

  async expire(key, seconds) {
    if (this.data.has(key)) {
      setTimeout(() => this.data.delete(key), seconds * 1000);
      return 1;
    }
    return 0;
  }

  async incr(key) {
    const val = parseInt(this.data.get(key) || '0');
    const newVal = val + 1;
    this.data.set(key, newVal.toString());
    return newVal;
  }

  async hset(key, field, value) {
    const hash = this.data.get(key) || {};
    hash[field] = value;
    this.data.set(key, hash);
    return 1;
  }

  async hget(key, field) {
    const hash = this.data.get(key) || {};
    return hash[field] || null;
  }

  async hgetall(key) {
    return this.data.get(key) || {};
  }

  async lpush(key, value) {
    const list = this.data.get(key) || [];
    list.unshift(value);
    this.data.set(key, list);
    return list.length;
  }

  async lrange(key, start, stop) {
    const list = this.data.get(key) || [];
    if (stop === -1) stop = list.length - 1;
    return list.slice(start, stop + 1);
  }

  async publish(channel, message) {
    return 1;
  }

  async subscribe(channel, callback) {
    return Promise.resolve();
  }

  on(event, callback) {
    // Mock event handler
  }

  quit() {
    return Promise.resolve();
  }
}

// Export singleton instance
module.exports = new MockRedisClient();