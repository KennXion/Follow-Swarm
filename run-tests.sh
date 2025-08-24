#!/bin/bash

echo "🧪 Follow-Swarm Test Suite"
echo "========================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Stop any running servers
echo "📋 Stopping any running servers..."
pkill -f "node.*index.js" 2>/dev/null
pkill -f "nodemon" 2>/dev/null
sleep 2

# Check if test database exists
echo "🗄️  Checking test database..."
if ! docker exec spotify_swarm_postgres psql -U postgres -lqt | cut -d \| -f 1 | grep -qw spotify_swarm_test; then
    echo "Creating test database..."
    docker exec spotify_swarm_postgres psql -U postgres -c "CREATE DATABASE spotify_swarm_test;"
    
    echo "Running migrations..."
    docker exec -i spotify_swarm_postgres psql -U postgres -d spotify_swarm_test < src/database/schema.sql
    docker exec -i spotify_swarm_postgres psql -U postgres -d spotify_swarm_test < src/database/migrations/002_update_schema.sql
else
    echo -e "${GREEN}✓${NC} Test database exists"
fi

echo ""
echo "🚀 Running Backend Tests"
echo "------------------------"
NODE_ENV=test npm test -- --forceExit

echo ""
echo "📊 Test Summary"
echo "---------------"
NODE_ENV=test npm test -- --forceExit 2>&1 | grep -E "(Test Suites:|Tests:)"

echo ""
echo -e "${GREEN}✅ Test run complete!${NC}"