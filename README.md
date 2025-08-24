# Spotify Follow-Swarm

An automated Spotify artist follow exchange platform that helps artists grow their follower base through a community-driven network effect.

## Features

- 🎵 Automated Spotify artist following with OAuth 2.0
- ⚡ Smart rate limiting and throttling
- 📊 Analytics and progress tracking
- 💳 Subscription tiers (Free, Pro, Premium)
- 🔐 Secure token encryption
- 📈 Real-time progress monitoring
- 🚀 Scalable queue-based architecture

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL, Redis
- **Queue**: Bull
- **Authentication**: Spotify OAuth 2.0
- **Security**: AES-256-GCM encryption, JWT

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Spotify Developer Account
- Docker & Docker Compose (optional)

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/spotify-follow-swarm.git
cd spotify-follow-swarm
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and add your Spotify API credentials:
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REDIRECT_URI`

### 4. Start services with Docker

```bash
docker-compose up -d postgres redis
```

### 5. Run database migrations

```bash
npm run migrate
```

### 6. Seed database (optional, for development)

```bash
npm run seed
```

### 7. Start the application

```bash
npm run dev
```

The application will be available at `http://localhost:3001`

## Project Structure

```
spotify-follow-swarm/
├── src/
│   ├── api/           # API routes and controllers
│   ├── auth/          # Authentication logic
│   ├── engine/        # Follow engine implementation
│   ├── queue/         # Queue management
│   ├── database/      # Database connections and queries
│   ├── middleware/    # Express middleware
│   ├── services/      # Business logic services
│   └── utils/         # Utility functions
├── client/            # Frontend application
├── tests/             # Test files
├── config/            # Configuration files
├── scripts/           # Utility scripts
└── docker/            # Docker configurations
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run start` - Start production server
- `npm run worker` - Start queue worker
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with test data
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## API Endpoints

### Authentication
- `GET /auth/spotify` - Initiate Spotify OAuth
- `GET /auth/callback` - OAuth callback handler
- `POST /auth/logout` - Logout user

### User Management
- `GET /api/user/profile` - Get user profile
- `POST /api/user/subscription` - Update subscription

### Follow Operations
- `POST /api/follows/sync` - Trigger follow sync
- `GET /api/follows/status` - Get follow status
- `POST /api/follows/pause` - Pause follows
- `POST /api/follows/resume` - Resume follows

## Configuration

### Rate Limiting

Configure rate limits in `.env`:
- `MAX_FOLLOWS_PER_HOUR=30`
- `MAX_FOLLOWS_PER_DAY=500`
- `MAX_FOLLOWS_PER_MONTH=10000`

### Subscription Tiers

- **Free**: 100 follows/month
- **Pro ($5/mo)**: 1000 follows/month + analytics
- **Premium ($10/mo)**: Unlimited + priority queue + CSV exports

## Security

- All OAuth tokens are encrypted using AES-256-GCM
- Session management with secure cookies
- Rate limiting on all endpoints
- SQL injection prevention
- XSS protection with Helmet.js

## Deployment

### Using Docker

```bash
docker build -t spotify-follow-swarm .
docker run -p 3001:3001 --env-file .env spotify-follow-swarm
```

### Using PM2

```bash
npm install -g pm2
pm2 start src/index.js --name spotify-follow-swarm
pm2 start src/worker.js --name spotify-follow-worker
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Support

For support, email support@spotifyswarm.com or open an issue on GitHub.

## Disclaimer

This project is for educational purposes. Always comply with Spotify's Terms of Service and API guidelines.