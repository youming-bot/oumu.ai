# Development Guide

Welcome to the development documentation for the Shadowing Learning project. This section provides comprehensive resources for developers contributing to the project.

## 📚 Development Resources

### 🚀 Getting Started
- [Development Setup](setup.md) - Environment configuration and tools
- [Coding Standards](coding-standards.md) - Code style and conventions
- [Testing Strategy](testing.md) - Testing approach and tools
- [Error Handling](error-handling.md) - Error management patterns
- [Deployment Guide](deployment.md) - Production deployment and DevOps

### 🏗️ Technical Architecture
- [System Architecture](../architecture/system-design.md) - High-level design
- [Component Architecture](../architecture/components.md) - Frontend structure
- [API Reference](../api-reference/README.md) - API documentation

### 🛠️ Development Tools
- **TypeScript**: Strict typing and compilation
- **Biome.js**: Code formatting and linting
- **Jest**: Testing framework
- **React Testing Library**: Component testing
- **shadcn/ui**: UI component library
- **pnpm**: Package manager

### 📁 Project Structure
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

## 🎯 Quick Start for Developers

### 1. Environment Setup
```bash
# Clone repository
git clone https://github.com/your-repo/shadowing-learning.git
cd shadowing-learning

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development
pnpm dev
```

### 2. Development Commands
```bash
# Type checking
pnpm type-check

# Code quality
pnpm lint
pnpm format
pnpm check

# Testing
pnpm test
pnpm test:watch
pnpm test:coverage

# Build
pnpm build
```

### 3. Development Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes
# Write tests
# Run checks
pnpm check && pnpm test

# Commit changes
git commit -m "feat: add your feature"

# Push and create PR
git push origin feature/your-feature
```

## 📋 Development Guidelines

### Code Quality
- **TypeScript**: Strict mode, no `any` types
- **Testing**: 80%+ coverage required
- **Documentation**: JSDoc comments for all functions
- **Standards**: Follow Biome.js formatting

### Commit Messages
- Use [Conventional Commits](https://conventionalcommits.org/)
- Format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Pull Requests
- **Description**: Detailed explanation of changes
- **Testing**: All tests must pass
- **Documentation**: Update relevant documentation
- **Review**: Address all reviewer feedback

## 🔧 Common Development Tasks

### Adding New Components
```typescript
// src/components/new-component.tsx
interface NewComponentProps {
  title: string;
  onAction?: () => void;
}

export const NewComponent: React.FC<NewComponentProps> = ({
  title,
  onAction
}) => {
  return (
    <div className="component">
      <h2>{title}</h2>
      {onAction && <button onClick={onAction}>Action</button>}
    </div>
  );
};
```

### Adding New Hooks
```typescript
// src/hooks/use-new-hook.ts
export function useNewHook(initialValue: string) {
  const [value, setValue] = useState(initialValue);

  const updateValue = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);

  return { value, updateValue };
}
```

### Adding New API Routes
```typescript
// src/app/api/new-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Process request
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## 🧪 Testing Guidelines

### Unit Tests
```typescript
describe('NewComponent', () => {
  it('renders with title', () => {
    const { getByText } = render(<NewComponent title="Test" />);
    expect(getByText('Test')).toBeInTheDocument();
  });
});
```

### Integration Tests
```typescript
describe('User Workflow', () => {
  it('completes file upload workflow', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Simulate user actions
    await user.upload(fileInput, testFile);
    await waitFor(() => {
      expect(screen.getByText('Upload complete')).toBeInTheDocument();
    });
  });
});
```

## 🚨 Common Issues

### TypeScript Errors
```bash
# Check types
pnpm type-check

# Clear cache
rm -rf .next node_modules/.cache
pnpm install
```

### Test Failures
```bash
# Run specific test
pnpm test -- --testPathPattern=filename

# Debug tests
pnpm test:watch -- --verbose

# Clear Jest cache
pnpm test -- --clearCache
```

### Build Issues
```bash
# Clean build
rm -rf .next out
pnpm install
pnpm build
```

## 🚀 Deployment

### Production Build
```bash
# Build for production
pnpm build

# Test production build
pnpm start

# Deploy to Vercel
vercel --prod
```

### Environment Configuration
```env
# Production
NODE_ENV=production
GROQ_API_KEY=your_production_key
OPENROUTER_API_KEY=your_production_key
```

## 📚 Additional Resources

### Project Documentation
- [Project Overview](../README.md)
- [Architecture](../architecture/README.md)
- [User Guide](../user-guide/README.md)
- [API Reference](../api-reference/README.md)
- [Contributing Guidelines](../appendices/contributing.md)

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Biome.js Documentation](https://biomejs.dev)

### Community
- [GitHub Issues](https://github.com/your-repo/shadowing-learning/issues)
- [GitHub Discussions](https://github.com/your-repo/shadowing-learning/discussions)
- [Stack Overflow](https://stackoverflow.com)

---

*This guide is part of the Development series. See individual guides for detailed information on specific topics.*