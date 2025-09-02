/**
 * Swagger API Documentation Configuration
 * 
 * Configures OpenAPI/Swagger documentation for the Follow-Swarm API
 * with comprehensive endpoint documentation and schema definitions.
 */

const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('../config');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Follow-Swarm API',
    version: '1.0.0',
    description: 'Spotify artist follow exchange platform API',
    contact: {
      name: 'Follow-Swarm Support',
      email: 'support@followswarm.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: config.server.env === 'production' 
        ? 'https://api.followswarm.com' 
        : `http://localhost:${config.server.port}`,
      description: config.server.env === 'production' ? 'Production server' : 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      sessionAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'connect.sid'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique user identifier'
          },
          spotifyId: {
            type: 'string',
            description: 'Spotify user ID'
          },
          displayName: {
            type: 'string',
            description: 'User display name'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
          },
          profileImage: {
            type: 'string',
            format: 'uri',
            description: 'Profile image URL'
          },
          subscriptionTier: {
            type: 'string',
            enum: ['free', 'pro', 'premium'],
            description: 'User subscription level'
          }
        }
      },
      Artist: {
        type: 'object',
        properties: {
          artistId: {
            type: 'string',
            description: 'Spotify artist ID'
          },
          name: {
            type: 'string',
            description: 'Artist name'
          },
          metadata: {
            type: 'object',
            description: 'Additional artist metadata'
          }
        }
      },
      RateLimits: {
        type: 'object',
        properties: {
          hourlyLimit: {
            type: 'integer',
            description: 'Maximum follows per hour'
          },
          dailyLimit: {
            type: 'integer',
            description: 'Maximum follows per day'
          },
          monthlyLimit: {
            type: 'integer',
            description: 'Maximum follows per month'
          },
          hourlyUsed: {
            type: 'integer',
            description: 'Follows used in current hour'
          },
          dailyUsed: {
            type: 'integer',
            description: 'Follows used today'
          },
          monthlyUsed: {
            type: 'integer',
            description: 'Follows used this month'
          },
          resetTimes: {
            type: 'object',
            properties: {
              hourly: {
                type: 'string',
                format: 'date-time'
              },
              daily: {
                type: 'string',
                format: 'date-time'
              },
              monthly: {
                type: 'string',
                format: 'date-time'
              }
            }
          }
        }
      },
      FollowJob: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Job identifier'
          },
          userId: {
            type: 'string',
            description: 'User who created the job'
          },
          artistIds: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'List of artist IDs to follow'
          },
          status: {
            type: 'string',
            enum: ['pending', 'processing', 'completed', 'failed'],
            description: 'Job status'
          },
          progress: {
            type: 'object',
            properties: {
              total: {
                type: 'integer'
              },
              completed: {
                type: 'integer'
              },
              failed: {
                type: 'integer'
              }
            }
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          completedAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether the request was successful'
          },
          message: {
            type: 'string',
            description: 'Response message'
          },
          data: {
            type: 'object',
            description: 'Response data'
          },
          error: {
            type: 'string',
            description: 'Error message if request failed'
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error type'
          },
          message: {
            type: 'string',
            description: 'Error description'
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    },
    {
      sessionAuth: []
    }
  ]
};

// Options for the swagger docs
const options = {
  definition: swaggerDefinition,
  apis: ['./src/api/*.js', './src/swagger.js'], // paths to files containing OpenAPI definitions
};

// Initialize swagger-jsdoc
const specs = swaggerJSDoc(options);

module.exports = {
  specs,
  swaggerUi,
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Follow-Swarm API Documentation'
  })
};

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication and session management
 *   - name: Follow Operations
 *     description: Artist following operations and management
 *   - name: Admin
 *     description: Administrative endpoints (admin access required)
 *   - name: Health
 *     description: System health and status endpoints
 */

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Check system health
 *     description: Returns system health status and basic metrics
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 environment:
 *                   type: string
 *                   example: "development"
 *                 database:
 *                   type: string
 *                   example: "connected"
 *                 redis:
 *                   type: string
 *                   example: "connected"
 */

/**
 * @swagger
 * /auth/spotify:
 *   get:
 *     tags: [Authentication]
 *     summary: Initiate Spotify OAuth flow
 *     description: Redirects user to Spotify for authentication
 *     responses:
 *       302:
 *         description: Redirect to Spotify OAuth
 *       500:
 *         description: OAuth initiation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /auth/callback:
 *   get:
 *     tags: [Authentication]
 *     summary: Handle Spotify OAuth callback
 *     description: Processes OAuth callback from Spotify and creates user session
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code from Spotify
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *         description: CSRF protection state parameter
 *     responses:
 *       200:
 *         description: Authentication successful, redirects to frontend
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       400:
 *         description: Invalid state or missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /auth/status:
 *   get:
 *     tags: [Authentication]
 *     summary: Check authentication status
 *     description: Returns current user authentication status and profile
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Authentication status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 authenticated:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 hasValidTokens:
 *                   type: boolean
 *       500:
 *         description: Status check failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout user
 *     description: Destroys user session and logs out
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Logout failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh access token
 *     description: Refreshes Spotify access token using refresh token
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Token refresh failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /auth/revoke:
 *   post:
 *     tags: [Authentication]
 *     summary: Revoke Spotify tokens
 *     description: Revokes all Spotify tokens and forces re-authentication
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Tokens revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Token revocation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
