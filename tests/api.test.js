const request = require('supertest');
const app = require('../src/index');
const db = require('../src/database');
const { generateApiToken } = require('../src/middleware/auth');

describe('API Endpoints', () => {
  let testUser;
  let authToken;
  let agent;

  beforeAll(async () => {
    await db.connect();
    
    // Create test user
    testUser = await db.insert('users', {
      spotify_id: 'api_test_user',
      email: 'api@example.com',
      display_name: 'API Test User',
      subscription_tier: 'pro'
    });

    // Generate auth token
    authToken = generateApiToken(testUser.id);
    
    // Create agent for session testing
    agent = request.agent(app);
  });

  afterAll(async () => {
    if (testUser) {
      // Clean up any related data
      await db.query('DELETE FROM follows WHERE follower_user_id = $1', [testUser.id]);
      await db.query('DELETE FROM queue_jobs WHERE user_id = $1', [testUser.id]);
      await db.delete('users', testUser.id);
    }
    await db.disconnect();
  });

  describe('Health Check', () => {
    it('GET /health should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('Follow API', () => {
    describe('GET /api/follows/rate-limits', () => {
      it('should require authentication', async () => {
        await request(app)
          .get('/api/follows/rate-limits')
          .expect(401);
      });

      it('should return rate limits for authenticated user', async () => {
        const response = await request(app)
          .get('/api/follows/rate-limits')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('canFollow');
        expect(response.body.data).toHaveProperty('limits');
        expect(response.body.data.limits).toHaveProperty('hourly');
        expect(response.body.data.limits).toHaveProperty('daily');
        expect(response.body.data.limits).toHaveProperty('monthly');
      });
    });

    describe('GET /api/follows/suggestions', () => {
      it('should return artist suggestions', async () => {
        // Create some test artists
        const artist = await db.insert('users', {
          spotify_id: 'suggested_artist',
          display_name: 'Suggested Artist',
          subscription_tier: 'premium',
          is_active: true
        });

        const response = await request(app)
          .get('/api/follows/suggestions?limit=5')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        
        // Clean up
        await db.delete('users', artist.id);
      });
    });

    describe('POST /api/follows/single', () => {
      it('should require artist ID', async () => {
        const response = await request(app)
          .post('/api/follows/single')
          .set('Authorization', `Bearer ${authToken}`)
          .send({})
          .expect(400);
        
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Artist ID is required');
      });

      it('should queue single follow job', async () => {
        const response = await request(app)
          .post('/api/follows/single')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ artistId: 'test_artist_123' })
          .expect(200);
        
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('artistId', 'test_artist_123');
        expect(response.body.data).toHaveProperty('status', 'queued');
      });

      it('should respect rate limits', async () => {
        // Create many follows to trigger rate limit
        const follows = [];
        for (let i = 0; i < 35; i++) {
          const follow = await db.insert('follows', {
            follower_user_id: testUser.id,
            target_artist_id: `rate_limit_artist_${i}`,
            status: 'completed',
            created_at: new Date()
          });
          follows.push(follow);
        }

        const response = await request(app)
          .post('/api/follows/single')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ artistId: 'blocked_artist' })
          .expect(429);
        
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Rate limit exceeded');
        expect(response.body).toHaveProperty('nextSlot');
        expect(response.body).toHaveProperty('limits');

        // Clean up
        for (const follow of follows) {
          await db.delete('follows', follow.id);
        }
      });
    });

    describe('POST /api/follows/batch', () => {
      it('should require pro or premium subscription', async () => {
        // Create free user
        const freeUser = await db.insert('users', {
          spotify_id: 'free_user',
          email: 'free@example.com',
          subscription_tier: 'free'
        });
        const freeToken = generateApiToken(freeUser.id);

        const response = await request(app)
          .post('/api/follows/batch')
          .set('Authorization', `Bearer ${freeToken}`)
          .send({ artistIds: ['artist1', 'artist2'] })
          .expect(403);
        
        expect(response.body.error).toContain('Insufficient subscription');

        // Clean up
        await db.delete('users', freeUser.id);
      });

      it('should queue batch follow jobs for pro user', async () => {
        const response = await request(app)
          .post('/api/follows/batch')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ 
            artistIds: ['batch_artist_1', 'batch_artist_2', 'batch_artist_3']
          })
          .expect(200);
        
        expect(response.body.success).toBe(true);
        expect(response.body.data.jobCount).toBe(3);
        expect(response.body.data.jobIds).toHaveLength(3);
      });

      it('should reject batch size exceeding limit', async () => {
        const artistIds = Array(60).fill(0).map((_, i) => `artist_${i}`);
        
        const response = await request(app)
          .post('/api/follows/batch')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ artistIds })
          .expect(400);
        
        expect(response.body.error).toContain('Batch size exceeds maximum');
      });
    });

    describe('GET /api/follows/history', () => {
      it('should return follow history', async () => {
        // Create test follows
        const follow1 = await db.insert('follows', {
          follower_user_id: testUser.id,
          target_artist_id: 'history_artist_1',
          status: 'completed'
        });

        const follow2 = await db.insert('follows', {
          follower_user_id: testUser.id,
          target_artist_id: 'history_artist_2',
          status: 'pending'
        });

        const response = await request(app)
          .get('/api/follows/history')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThanOrEqual(2);
        expect(response.body).toHaveProperty('pagination');

        // Test with status filter
        const completedResponse = await request(app)
          .get('/api/follows/history?status=completed')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        
        const completedIds = completedResponse.body.data.map(f => f.id);
        expect(completedIds).toContain(follow1.id);
        expect(completedIds).not.toContain(follow2.id);

        // Clean up
        await db.delete('follows', follow1.id);
        await db.delete('follows', follow2.id);
      });
    });

    describe('GET /api/follows/stats', () => {
      it('should return user statistics', async () => {
        const response = await request(app)
          .get('/api/follows/stats?period=7d')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('summary');
        expect(response.body.data).toHaveProperty('daily');
        expect(response.body.data).toHaveProperty('period', '7d');
      });
    });

    describe('GET /api/follows/jobs', () => {
      it('should return user jobs', async () => {
        // Create test job
        const job = await db.insert('queue_jobs', {
          user_id: testUser.id,
          job_type: 'follow',
          status: 'queued',
          payload: { targetArtistId: 'job_artist' }
        });

        const response = await request(app)
          .get('/api/follows/jobs')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        
        const jobIds = response.body.data.map(j => j.id);
        expect(jobIds).toContain(job.id);

        // Clean up
        await db.delete('queue_jobs', job.id);
      });
    });

    describe('DELETE /api/follows/jobs', () => {
      it('should cancel all pending jobs', async () => {
        // Create test jobs
        const jobs = [];
        for (let i = 0; i < 2; i++) {
          const job = await db.insert('queue_jobs', {
            user_id: testUser.id,
            job_type: 'follow',
            status: 'queued'
          });
          jobs.push(job);
        }

        const response = await request(app)
          .delete('/api/follows/jobs')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        
        expect(response.body.success).toBe(true);
        expect(response.body.data.cancelledCount).toBe(2);

        // Verify jobs are cancelled
        for (const job of jobs) {
          const updated = await db.findOne('queue_jobs', { id: job.id });
          expect(updated.status).toBe('cancelled');
        }

        // Clean up
        for (const job of jobs) {
          await db.delete('queue_jobs', job.id);
        }
      });
    });

    describe('DELETE /api/follows/jobs/:jobId', () => {
      it('should cancel specific job', async () => {
        const job = await db.insert('queue_jobs', {
          user_id: testUser.id,
          job_type: 'follow',
          status: 'queued'
        });

        const response = await request(app)
          .delete(`/api/follows/jobs/${job.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        
        expect(response.body.success).toBe(true);
        expect(response.body.data.jobId).toBe(job.id);
        expect(response.body.data.status).toBe('cancelled');

        // Clean up
        await db.delete('queue_jobs', job.id);
      });

      it('should not cancel other users jobs', async () => {
        const otherUser = await db.insert('users', {
          spotify_id: 'other_user',
          email: 'other@example.com'
        });

        const job = await db.insert('queue_jobs', {
          user_id: otherUser.id,
          job_type: 'follow',
          status: 'queued'
        });

        await request(app)
          .delete(`/api/follows/jobs/${job.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        // Clean up
        await db.delete('queue_jobs', job.id);
        await db.delete('users', otherUser.id);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .expect(404);
      
      expect(response.body).toHaveProperty('error', 'Not Found');
    });

    it('should handle malformed JSON', async () => {
      await request(app)
        .post('/api/follows/single')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });
  });
});