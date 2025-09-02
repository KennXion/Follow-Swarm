# Follow-Swarm API Documentation

## Overview

The Follow-Swarm API provides endpoints for managing Spotify artist follow operations, user authentication, and administrative functions. The API is built with Express.js and documented using OpenAPI/Swagger.

## Base URL

- **Development**: `http://localhost:3001`
- **Production**: `https://api.followswarm.com`

## Interactive Documentation

Access the interactive Swagger UI documentation at:
- `{BASE_URL}/api-docs`

## Authentication

The API supports two authentication methods:

### 1. JWT Bearer Token
```http
Authorization: Bearer <jwt_token>
```

### 2. Session Cookie
```http
Cookie: connect.sid=<session_id>
```

## Rate Limiting

API endpoints are rate-limited based on subscription tiers:

| Tier | Hourly Limit | Daily Limit | Monthly Limit |
|------|--------------|-------------|---------------|
| Free | 30 | 500 | 10,000 |
| Pro | 100 | 2,000 | 50,000 |
| Premium | 300 | 10,000 | 200,000 |

## Endpoints Overview

### Authentication Endpoints

#### `GET /auth/spotify`
Initiates Spotify OAuth flow.

**Response**: Redirects to Spotify authorization page

#### `GET /auth/callback`
Handles OAuth callback from Spotify.

**Parameters**:
- `code` (query): Authorization code from Spotify
- `state` (query): CSRF protection state

#### `GET /auth/status`
Returns current authentication status.

**Response**:
```json
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "spotifyId": "spotify_user_id",
    "displayName": "User Name",
    "email": "user@example.com",
    "subscriptionTier": "free"
  },
  "hasValidTokens": true
}
```

#### `POST /auth/logout`
Logs out the current user.

**Authentication**: Required

### Follow Operations

#### `GET /api/follows/rate-limits`
Returns current rate limit status for the authenticated user.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "hourlyLimit": 30,
    "dailyLimit": 500,
    "monthlyLimit": 10000,
    "hourlyUsed": 5,
    "dailyUsed": 25,
    "monthlyUsed": 150,
    "resetTimes": {
      "hourly": "2025-09-02T01:00:00Z",
      "daily": "2025-09-03T00:00:00Z",
      "monthly": "2025-10-01T00:00:00Z"
    }
  }
}
```

#### `GET /api/follows/suggestions`
Returns suggested artists to follow.

**Authentication**: Required

**Parameters**:
- `limit` (query, optional): Number of suggestions (1-50, default: 20)
- `genre` (query, optional): Filter by genre

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "artistId": "4NHQUGzhtTLFvgF5SZesLK",
      "name": "Tame Impala",
      "metadata": {
        "genres": ["psychedelic rock", "indie rock"],
        "followers": 2500000
      }
    }
  ]
}
```

#### `POST /api/follows/single`
Follow a single artist.

**Authentication**: Required

**Request Body**:
```json
{
  "artistId": "4NHQUGzhtTLFvgF5SZesLK"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Artist followed successfully"
}
```

#### `POST /api/follows/batch`
Queue multiple artists to be followed.

**Authentication**: Required

**Request Body**:
```json
{
  "artistIds": ["4NHQUGzhtTLFvgF5SZesLK", "1Xyo4u8uXC1ZmMpatF05PJ"],
  "delay": 30
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "job_uuid",
    "status": "pending",
    "progress": {
      "total": 2,
      "completed": 0,
      "failed": 0
    }
  }
}
```

#### `GET /api/follows/jobs/{jobId}`
Get status of a follow job.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "job_uuid",
    "status": "processing",
    "progress": {
      "total": 2,
      "completed": 1,
      "failed": 0
    },
    "createdAt": "2025-09-02T00:30:00Z"
  }
}
```

#### `GET /api/follows/history`
Get user's follow history with pagination.

**Authentication**: Required

**Parameters**:
- `page` (query, optional): Page number (default: 1)
- `limit` (query, optional): Records per page (1-100, default: 20)
- `status` (query, optional): Filter by status (success, failed, pending)

### Admin Endpoints

#### `GET /api/admin/stats`
Get system statistics (admin only).

**Authentication**: Required (Admin)

**Response**:
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1250,
      "active": 340,
      "newToday": 15
    },
    "follows": {
      "total": 125000,
      "today": 2500,
      "successRate": 94.3
    },
    "system": {
      "uptime": 86400,
      "memoryUsage": {
        "used": 512,
        "total": 1024
      }
    }
  }
}
```

#### `GET /api/admin/users`
Get paginated list of users (admin only).

**Authentication**: Required (Admin)

**Parameters**:
- `page` (query, optional): Page number
- `limit` (query, optional): Users per page
- `search` (query, optional): Search by email/name
- `subscription` (query, optional): Filter by tier

### Health Check

#### `GET /health`
System health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-09-02T00:30:00Z",
  "uptime": 86400,
  "environment": "development",
  "database": "connected",
  "redis": "connected"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error Type",
  "message": "Human-readable error description",
  "timestamp": "2025-09-02T00:30:00Z"
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## SDKs and Examples

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  }
});

// Get rate limits
const rateLimits = await client.get('/api/follows/rate-limits');
console.log(rateLimits.data);

// Follow an artist
const followResult = await client.post('/api/follows/single', {
  artistId: '4NHQUGzhtTLFvgF5SZesLK'
});
```

### cURL Examples

```bash
# Get authentication status
curl -X GET http://localhost:3001/auth/status \
  -H "Authorization: Bearer your-jwt-token"

# Follow an artist
curl -X POST http://localhost:3001/api/follows/single \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{"artistId": "4NHQUGzhtTLFvgF5SZesLK"}'

# Get follow suggestions
curl -X GET "http://localhost:3001/api/follows/suggestions?limit=10" \
  -H "Authorization: Bearer your-jwt-token"
```

## Webhooks (Future Feature)

Webhook support for real-time notifications is planned for future releases.

## Support

For API support and questions:
- Documentation: `/api-docs` (interactive)
- Issues: GitHub Issues
- Email: support@followswarm.com
