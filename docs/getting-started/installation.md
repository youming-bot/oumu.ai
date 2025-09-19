# Installation Guide

This guide provides detailed instructions for installing and setting up the Shadowing Learning project for different use cases.

## 🎯 Installation Options

Choose the installation method that best suits your needs:

### Option 1: Cloud Deployment (Recommended for Users)
- **Best for**: End users who want to use the application
- **Requirements**: Modern web browser only
- **Time**: 2 minutes

### Option 2: Local Development (Recommended for Developers)
- **Best for**: Developers contributing to the project
- **Requirements**: Node.js 18+, Git, API keys
- **Time**: 15-30 minutes

### Option 3: Docker Deployment
- **Best for**: System administrators and deployment
- **Requirements**: Docker, Docker Compose
- **Time**: 10 minutes

---

## 🌐 Option 1: Cloud Deployment

### Direct Access
The simplest way to use Shadowing Learning is through our hosted service:

1. **Visit the application**
   ```
   https://shadowing-learning.app
   ```

2. **Create an account** (optional)
   - Email/Password authentication
   - Google OAuth available

3. **Start using** immediately
   - No installation required
   - Works on any modern browser
   - Automatic updates

### Browser Requirements
- **Chrome**: Version 90+
- **Firefox**: Version 88+
- **Safari**: Version 14+
- **Edge**: Version 90+

### Network Requirements
- **Minimum**: 1 Mbps connection
- **Recommended**: 5 Mbps+ for smooth audio streaming
- **Data Usage**: ~10-50MB per audio file processed

---

## 💻 Option 2: Local Development

### Prerequisites

#### System Requirements
- **Operating System**: Windows 10+, macOS 10.15+, Linux (Ubuntu 18.04+)
- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher
- **Git**: Version 2.0 or higher
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: 1GB free space

#### Verify Prerequisites
```bash
# Check Node.js version
node --version
# Expected: v18.0.0 or higher

# Check npm version
npm --version
# Expected: 8.0.0 or higher

# Check Git version
git --version
# Expected: 2.0.0 or higher
```

### Step-by-Step Installation

#### 1. Clone the Repository
```bash
# Clone the project
git clone https://github.com/your-repo/shadowing-learning.git

# Navigate to project directory
cd shadowing-learning

# Verify the project structure
ls -la
```

#### 2. Install Dependencies
```bash
# Install npm dependencies
npm install

# Verify installation
npm list --depth=0
```

#### 3. Configure Environment Variables
```bash
# Create environment file from template
cp .env.example .env.local

# Edit the environment file
nano .env.local  # or use your preferred editor
```

**Required Environment Variables:**
```env
# API Keys (required)
GROQ_API_KEY=your_groq_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here

# API Configuration
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=deepseek/deepseek-chat-v3.1:free

# Processing Configuration
MAX_CONCURRENCY=3
CHUNK_SECONDS=45
CHUNK_OVERLAP=0.2

# Optional Configuration
NODE_ENV=development
PORT=3000
```

#### 4. Verify Configuration
```bash
# Check if environment variables are set
cat .env.local
```

### Step 5: Start Development Server
```bash
# Start the development server
npm run dev

# Expected output:
# > shadowing-learning@1.0.0 dev
# > next dev
#
#   ▲ Next.js 15.0.0
#   - Local:        http://localhost:3000
#   - Network:      http://192.168.1.100:3000
#   - Environments: .env.local
```

#### 6. Verify Installation
Open your browser and navigate to `http://localhost:3000`. You should see:
- The Shadowing Learning application interface
- File upload component
- No console errors

### API Key Setup

#### Getting Groq API Key
1. Visit [Groq Console](https://console.groq.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your `.env.local`

#### Getting OpenRouter API Key
1. Visit [OpenRouter](https://openrouter.ai/keys)
2. Sign up or log in
3. Create a new API key
4. Copy the key to your `.env.local`

---

## 🐳 Option 3: Docker Deployment

### Prerequisites
- **Docker**: Version 20.0+
- **Docker Compose**: Version 2.0+

### Installation Steps

#### 1. Clone and Prepare
```bash
git clone https://github.com/your-repo/shadowing-learning.git
cd shadowing-learning
```

#### 2. Build Docker Image
```bash
# Build the Docker image
docker build -t shadowing-learning .

# Verify image built successfully
docker images | grep shadowing-learning
```

#### 3. Create Docker Compose Configuration
```yaml
# docker-compose.yml
version: '3.8'

services:
  shadowing-learning:
    image: shadowing-learning:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - GROQ_API_KEY=${GROQ_API_KEY}
      - OPENROUTER_API_KEY=${GROQ_API_KEY}
      - OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
      - OPENROUTER_MODEL=deepseek/deepseek-chat-v3.1:free
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

#### 4. Start Services
```bash
# Start the container
docker-compose up -d

# Check container status
docker-compose ps
```

#### 5. Access Application
Open your browser and navigate to `http://localhost:3000`

---

## 🔧 Common Installation Issues

### Node.js Version Issues
```bash
# If you have nvm installed
nvm install 18
nvm use 18

# Or update to latest LTS
nvm install --lts
nvm use --lts
```

### Permission Issues
```bash
# Fix npm permissions
npm config set prefix ~/.npm-global
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Dependency Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 🧪 Post-Installation Verification

### Development Environment Tests
```bash
# Run all tests
npm test

# Check code quality
npm run lint

# Verify build
npm run build

# Type checking
npm run type-check
```

### Functional Tests
1. **File Upload**: Test uploading an audio file
2. **Transcription**: Verify transcription works
3. **Playback**: Test audio playback with subtitles
4. **Export**: Test subtitle export functionality

---

## 📚 Next Steps

After successful installation:

### For Users
- Read the [User Guide](../user-guide/README.md)
- Explore [Features](../user-guide/features.md)
- Learn [Common Workflows](../user-guide/workflows.md)

### For Developers
- Set up your [Development Environment](../development/setup.md)
- Understand the [Project Structure](../architecture/components.md)
- Review [Coding Standards](../development/coding-standards.md)

### For Administrators
- Configure [Production Settings](../development/deployment.md)
- Set up [Monitoring](../development/monitoring.md)
- Review [Security Guidelines](../development/security.md)

---

*Need help? Check the [Troubleshooting](../user-guide/troubleshooting.md) section or create an issue on GitHub.*