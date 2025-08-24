#!/bin/bash

echo "🚀 Spotify Follow-Swarm Local Setup"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Homebrew is installed (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! command -v brew &> /dev/null; then
        echo -e "${YELLOW}Homebrew not found. Installing Homebrew...${NC}"
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    # Install PostgreSQL if not installed
    if ! command -v psql &> /dev/null; then
        echo -e "${YELLOW}Installing PostgreSQL...${NC}"
        brew install postgresql@14
        brew services start postgresql@14
    else
        echo -e "${GREEN}✓ PostgreSQL is installed${NC}"
    fi
    
    # Install Redis if not installed
    if ! command -v redis-cli &> /dev/null; then
        echo -e "${YELLOW}Installing Redis...${NC}"
        brew install redis
        brew services start redis
    else
        echo -e "${GREEN}✓ Redis is installed${NC}"
    fi
    
    # Start services if not running
    echo -e "${YELLOW}Starting services...${NC}"
    brew services start postgresql@14
    brew services start redis
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux installation
    echo -e "${YELLOW}Detected Linux system${NC}"
    
    # Check for apt-get
    if command -v apt-get &> /dev/null; then
        # Install PostgreSQL
        if ! command -v psql &> /dev/null; then
            echo -e "${YELLOW}Installing PostgreSQL...${NC}"
            sudo apt-get update
            sudo apt-get install -y postgresql postgresql-contrib
            sudo systemctl start postgresql
        fi
        
        # Install Redis
        if ! command -v redis-cli &> /dev/null; then
            echo -e "${YELLOW}Installing Redis...${NC}"
            sudo apt-get install -y redis-server
            sudo systemctl start redis-server
        fi
    else
        echo -e "${RED}Package manager not supported. Please install PostgreSQL and Redis manually.${NC}"
        exit 1
    fi
fi

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 3

# Create database
echo -e "${YELLOW}Creating database...${NC}"
createdb spotify_swarm 2>/dev/null || echo -e "${GREEN}Database already exists${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}Please update .env with your Spotify API credentials${NC}"
fi

# Run migrations
echo -e "${YELLOW}Running database migrations...${NC}"
npm run migrate

echo ""
echo -e "${GREEN}✅ Local setup complete!${NC}"
echo ""
echo "Services running:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo ""
echo "Next steps:"
echo "  1. Update .env with your Spotify API credentials"
echo "  2. Run 'npm run dev' to start the application"
echo ""