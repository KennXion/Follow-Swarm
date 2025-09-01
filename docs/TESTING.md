# Testing Documentation

## Overview
The Follow-Swarm application uses Jest for unit and integration testing. Tests are designed to run without external dependencies through comprehensive mocking.

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/auth.test.js

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Test Structure

### Test Files Location
- Unit tests: `tests/unit/`
- Integration tests: `tests/`
- API tests: `tests/api/`
- Middleware tests: `tests/middleware/`

### Test Setup
The test environment is configured in:
- `jest.config.js` - Jest configuration
- `tests/setup.js` - Global test setup and mocks

## Mocking Strategy

### Redis Mock
Redis is fully mocked in the test environment to avoid requiring a Redis server:
- Mock implementation in `tests/setup.js`
- Handles session management, caching, and pub/sub operations
- Supports variable argument signatures for compatibility with connect-redis

### Database Mock
PostgreSQL connections are mocked for unit tests:
- Integration tests use a test database
- Database cleanup happens automatically after tests

### Queue Manager Mock
Bull queues are mocked to avoid Redis dependency:
- Mock returns predictable job IDs
- Simulates queue operations without actual job processing

## Common Test Issues and Solutions

### Issue: Test Timeouts
**Solution**: Tests have a 30-second timeout by default. For auth tests, ensure Redis mock is properly initialized.

### Issue: Session/Redis Errors
**Solution**: The Redis mock handles variable callback signatures. Check that the mock in `tests/setup.js` is loaded before tests run.

### Issue: Encryption Tests
**Solution**: Empty strings are handled specially - they return empty strings without encryption/decryption.

### Issue: Bot Protection Thresholds
**Solution**: Risk scores in tests should match the actual implementation thresholds (e.g., 0.3 for new accounts).

## Test Coverage

Current test statistics:
- 10 test suites
- 107 total tests
- Key areas covered:
  - Authentication flows
  - API endpoints
  - Middleware functionality
  - Encryption utilities
  - Bot protection
  - Follow engine
  - Queue management

## Writing New Tests

### Test Template
```javascript
describe('Feature Name', () => {
  beforeAll(async () => {
    // Setup code
  });

  afterAll(async () => {
    // Cleanup code
  });

  it('should perform expected behavior', async () => {
    // Test implementation
    expect(result).toBe(expected);
  });
});
```

### Best Practices
1. Use descriptive test names
2. Clean up test data after each test
3. Mock external dependencies
4. Test both success and failure cases
5. Keep tests isolated and independent

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Pre-commit hooks (if configured)

## Troubleshooting

### Debug Mode
```bash
# Run tests with detailed output
npm test -- --verbose

# Debug specific test
node --inspect-brk ./node_modules/.bin/jest tests/auth.test.js
```

### Common Fixes Applied
1. **Redis Mock**: Fixed circular references and callback signatures
2. **Encryption**: Handle empty strings properly
3. **Bot Protection**: Adjusted risk score thresholds
4. **Follow Routes**: Fixed function reference errors
5. **Test Timeouts**: Reduced timeouts and improved mocking

## Maintenance

Regular maintenance tasks:
- Update test dependencies monthly
- Review and update mocks when adding new features
- Maintain test coverage above 70%
- Clean up obsolete tests