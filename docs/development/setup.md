# Development Setup

This guide covers setting up a development environment for contributing to the Shadowing Learning project.

## 🛠️ Prerequisites

### System Requirements
- **Node.js**: Version 18.0 or higher
- **pnpm**: Package manager (recommended)
- **Git**: Version control system
- **IDE**: VS Code (recommended) with TypeScript support

### Required Accounts
- **Groq API**: For speech-to-text transcription
- **OpenRouter API**: For text processing and normalization

## 🚀 Quick Setup

### 1. Clone and Install
```bash
# Clone the repository
git clone https://github.com/your-repo/shadowing-learning.git
cd shadowing-learning

# Install dependencies
pnpm install
```

### 2. Environment Configuration
```bash
# Create environment file
cp .env.example .env.local

# Edit with your API keys
# Required: GROQ_API_KEY, OPENROUTER_API_KEY
# Optional: Other configuration variables
```

### 3. Development Server
```bash
# Start development server
pnpm dev

# Open http://localhost:3000
```

## 🔧 Development Tools

### Code Quality
```bash
# Type checking
pnpm type-check

# Linting
pnpm lint          # Check for issues
pnpm lint:fix      # Auto-fix issues

# Formatting
pnpm format        # Format code
pnpm format:fix    # Format and fix

# Combined checks
pnpm check         # Run all quality checks
pnpm check:fix     # Run checks with auto-fix
```

### Testing
```bash
# Run all tests
pnpm test

# Watch mode for development
pnpm test:watch

# Coverage report
pnpm test:coverage

# Run specific test
pnpm test -- --testPathPattern=filename
```

### Database Management
```bash
# Reset local database (development only)
# Clear browser data or use dev tools

# Migration helpers
./scripts/migrate-to-biome.sh
./scripts/verify-biome-migration.sh
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── *.tsx             # Custom components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── types/                 # TypeScript definitions
└── __tests__/             # Test files
```

## 🎯 Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes
# Write tests
# Run quality checks
pnpm check && pnpm test

# Commit changes
git commit -m "feat: add your feature description"
```

### 2. Code Quality
- **TypeScript**: Strict mode enabled, no `any` types
- **Biome.js**: Code formatting and linting
- **Testing**: 80%+ coverage required
- **Documentation**: Update relevant docs

### 3. Testing Strategy
- **Unit Tests**: For utilities and hooks
- **Component Tests**: For React components
- **Integration Tests**: For critical workflows
- **API Tests**: For route handlers

## 🔍 Debugging

### Common Issues
```bash
# TypeScript errors
pnpm type-check

# Linting issues
pnpm lint

# Test failures
pnpm test -- --verbose

# Build issues
pnpm build
```

### Development Tools
- **React DevTools**: Component inspection
- **Browser DevTools**: Network and debugging
- **IndexedDB DevTools**: Database inspection

## 📚 IDE Setup

### VS Code Extensions (Recommended)
- **TypeScript**: Language support
- **Biome**: Code formatting and linting
- **ESLint**: Additional linting
- **Prettier**: Code formatting
- **GitLens**: Git integration
- **React DevTools**: React debugging

### VS Code Settings
```json
{
  "typescript.preferences.preferTypeOnlyAutoImports": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "editor.codeActionsOnSave": {
    "source.organizeImports": "explicit"
  }
}
```

## 🚢 Deployment

### Build Process
```bash
# Production build
pnpm build

# Start production server
pnpm start
```

### Environment Variables
```env
# Production
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Development
NODE_ENV=development
```

## 🤝 Contributing

### Before Submitting
1. **Run all checks**: `pnpm check && pnpm test`
2. **Update documentation**: Add relevant docs
3. **Test locally**: Verify functionality works
4. **Follow conventions**: Use established patterns

### Pull Request Process
1. **Create PR**: From feature branch to main
2. **Link issues**: Reference related GitHub issues
3. **Describe changes**: Detailed PR description
4. **Review feedback**: Address reviewer comments

## 📞 Getting Help

### Resources
- **Documentation**: [Project Docs](../README.md)
- **Issues**: [GitHub Issues](https://github.com/your-repo/shadowing-learning/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/shadowing-learning/discussions)

### Common Problems
- **Build errors**: Check TypeScript and dependencies
- **Test failures**: Review test setup and mocks
- **API issues**: Verify environment variables
- **Database problems**: Clear IndexedDB data

---

*This guide is part of the Development series. See [Development](README.md) for more resources.*