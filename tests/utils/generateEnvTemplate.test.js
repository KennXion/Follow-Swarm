/**
 * Generate Env Template Tests
 */

const fs = require('fs');
const path = require('path');

describe('Generate Env Template', () => {
  it('should have env.example file', () => {
    const envExamplePath = path.join(__dirname, '../../.env.example');
    expect(fs.existsSync(envExamplePath)).toBe(true);
  });

  it('should contain required environment variables', () => {
    const envExamplePath = path.join(__dirname, '../../.env.example');
    const content = fs.readFileSync(envExamplePath, 'utf8');
    
    // Check for essential variables
    expect(content).toContain('DATABASE_URL=');
    expect(content).toContain('REDIS_URL=');
    expect(content).toContain('JWT_SECRET=');
    expect(content).toContain('SPOTIFY_CLIENT_ID=');
    expect(content).toContain('SPOTIFY_CLIENT_SECRET=');
  });

  it('should have proper format', () => {
    const envExamplePath = path.join(__dirname, '../../.env.example');
    const content = fs.readFileSync(envExamplePath, 'utf8');
    
    // Check for comments
    expect(content).toContain('#');
    
    // Check for sections
    expect(content).toContain('Server Configuration');
    expect(content).toContain('Database Configuration');
    expect(content).toContain('Redis Configuration');
  });
});