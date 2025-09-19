# Contributing Guidelines

Thank you for your interest in contributing to the Shadowing Learning project! This guide will help you get started with contributing effectively.

## 🎯 Contribution Philosophy

We welcome contributions that:
- **Improve the project**: Code, documentation, tests, or design
- **Fix issues**: Bug fixes, error handling, or performance improvements
- **Add features**: New functionality that aligns with project goals
- **Enhance documentation**: Better user guides, API docs, or code comments
- **Improve accessibility**: Making the app more inclusive

## 🚀 Getting Started

### 1. Fork and Clone
```bash
# Fork the repository on GitHub
git clone https://github.com/your-username/shadowing-learning.git
cd shadowing-learning

# Add upstream remote
git remote add upstream https://github.com/original-repo/shadowing-learning.git
```

### 2. Setup Development Environment
```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local

# Configure environment variables
# Edit .env.local with your API keys

# Start development server
pnpm dev
```

### 3. Run Tests and Checks
```bash
# Type checking
pnpm type-check

# Code quality
pnpm check

# Run tests
pnpm test

# Build verification
pnpm build
```

## 📋 Development Workflow

### 1. Choose What to Work On
- **Issues**: Check [GitHub Issues](https://github.com/your-repo/shadowing-learning/issues)
- **Good first issues**: Look for `good first issue` label
- **Feature requests**: Check `enhancement` label
- **Bug reports**: Look for `bug` label

### 2. Create Your Branch
```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
# Or for bug fixes:
git checkout -b fix/issue-description
```

### 3. Make Your Changes
```bash
# Make your changes
# Write tests for new functionality
# Update documentation
# Run quality checks
pnpm check && pnpm test

# Commit your changes
git add .
git commit -m "feat: add your feature description"
```

### 4. Submit Your Pull Request
```bash
# Push to your fork
git push origin feature/your-feature-name

# Create PR on GitHub
# Link to any related issues
# Provide detailed description
```

## 📝 Commit Message Standards

### Format
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting, styling
- `refactor`: Code restructuring
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks, dependencies

### Examples
```bash
feat(audio-player): add A-B loop functionality
fix(subtitle-sync): resolve timing precision issues
docs(readme): update installation instructions
style(components): format code with Biome
test(audio-player): add playback tests
chore(deps): update dependencies
```

### Good Commit Message
```
feat(audio-player): add A-B loop functionality

- Add A and B point selection controls
- Implement loop playback between selected points
- Add visual indicators for loop region
- Include keyboard shortcuts for loop control

Resolves #123
```

## 🧪 Testing Requirements

### Test Coverage
- **New features**: 80%+ code coverage required
- **Bug fixes**: Include regression tests
- **Critical paths**: Integration tests for user workflows
- **Edge cases**: Test error conditions and edge cases

### Test Structure
```
test/
├── unit/components/     # React component tests
├── unit/lib/           # Library function tests
├── unit/hooks/         # Custom hook tests
├── unit/app/api/       # API route tests
├── integration/        # Integration tests
└── e2e/               # End-to-end tests
```

### Test Examples
```typescript
// Unit test example
describe('AudioPlayer', () => {
  it('should play audio when play button is clicked', () => {
    const { getByLabelText } = render(<AudioPlayer src="/test.mp3" />);
    const playButton = getByLabelText('Play');
    fireEvent.click(playButton);
    expect(mockAudio.play).toHaveBeenCalled();
  });
});

// Integration test example
describe('File Upload Flow', () => {
  it('should upload file and show transcription', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Upload file
    const fileInput = screen.getByLabelText('Upload audio file');
    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    await user.upload(fileInput, file);

    // Wait for transcription
    await waitFor(() => {
      expect(screen.getByText('Transcription complete')).toBeInTheDocument();
    });
  });
});
```

## 📚 Documentation Standards

### Code Documentation
```typescript
/**
 * Processes audio file for transcription
 * @param file - Audio file to process
 * @param options - Processing options including language and chunk settings
 * @returns Promise resolving to processed transcript data
 * @throws {TranscriptionError} When processing fails
 * @example
 * const transcript = await processAudio(file, { language: 'ja' });
 */
export async function processAudio(
  file: File,
  options: ProcessingOptions = {}
): Promise<TranscriptData> {
  // Implementation
}
```

### Component Documentation
```typescript
/**
 * AudioPlayer component with playback controls and A-B looping
 *
 * @component
 * @example
 * <AudioPlayer
 *   src="/audio.mp3"
 *   onTimeUpdate={(time) => console.log(time)}
 *   enableLoop={true}
 * />
 */
export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  onTimeUpdate,
  enableLoop = false
}) => {
  // Implementation
};
```

### README Standards
- **Clear purpose**: What the component/module does
- **Props documentation**: All props with types and descriptions
- **Examples**: Usage examples with code
- **Accessibility**: ARIA labels and keyboard navigation
- **Performance**: Any performance considerations

## 🎨 Code Style Guidelines

### TypeScript
- **Strict mode**: No `any` types (except in tests)
- **Interface vs Type**: Use interfaces for objects, types for unions
- **Null safety**: Use strict null checking
- **Naming**: PascalCase for types/interfaces, camelCase for variables

### React
- **Functional components**: Use functional components with hooks
- **Custom hooks**: Extract complex logic to custom hooks
- **Props typing**: Always type component props
- **Error boundaries**: Implement for components handling external data

### Styling
- **Tailwind CSS**: Use utility classes for styling
- **shadcn/ui**: Follow established component patterns
- **Responsive**: Ensure mobile-friendly design
- **Accessibility**: Include proper ARIA labels

### File Organization
```
src/
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── audio-player.tsx
│   └── file-upload.tsx
├── hooks/
│   ├── use-audio-player.ts
│   └── use-files.ts
├── lib/
│   ├── audio-processor.ts
│   └── utils.ts
└── types/
    ├── database.ts
    └── errors.ts
```

## 🔍 Review Process

### Before Submitting
1. **Self-review**: Read through your changes
2. **Test locally**: Ensure everything works
3. **Documentation**: Update relevant docs
4. **Style check**: Run `pnpm check`
5. **Tests**: Run `pnpm test`

### During Review
1. **Be responsive**: Address reviewer comments promptly
2. **Be respectful**: Maintain constructive dialogue
3. **Explain changes**: Provide context for your decisions
4. **Iterate**: Make necessary improvements

### After Merge
1. **Delete branch**: Clean up your feature branches
2. **Sync with upstream**: Keep your fork updated
3. **Test in production**: Verify changes work as expected

## 🎯 Areas of Contribution

### Code Contributions
- **Feature development**: New functionality
- **Bug fixes**: Resolving issues
- **Performance improvements**: Optimizing code
- **Code refactoring**: Improving code quality
- **Test coverage**: Adding missing tests

### Documentation Contributions
- **User guides**: Improving user documentation
- **API docs**: Enhancing API documentation
- **Code comments**: Adding inline documentation
- **README files**: Improving project documentation

### Design Contributions
- **UI improvements**: Enhancing user interface
- **UX enhancements**: Improving user experience
- **Accessibility**: Making the app more inclusive
- **Responsive design**: Ensuring mobile compatibility

### Translation Contributions
- **Interface translations**: Adding new languages
- **Documentation translation**: Translating guides
- **Error messages**: Localizing error messages

## 🚫 Guidelines to Avoid

### Code Quality
- **No `any` types**: Use proper TypeScript typing
- **No large files**: Split large components into smaller ones
- **No hardcoded values**: Use constants and configuration
- **No commented code**: Remove unused code

### Security
- **No API keys**: Never commit API keys or secrets
- **No XSS vulnerabilities**: Sanitize user input
- **No hardcoded URLs**: Use environment variables
- **No console.log**: Remove debug statements

### Performance
- **No unnecessary re-renders**: Use React optimization
- **No large bundles**: Code split appropriately
- **No memory leaks**: Clean up event listeners and subscriptions
- **No blocking operations**: Use async/await properly

## 🏆 Recognition

### Contributor Recognition
- **Contributor list**: Added to project contributors
- **Release notes**: Mentioned in release notes
- **GitHub stars**: Recognition for significant contributions
- **Project maintainer**: For consistent, high-quality contributions

### Ways to Contribute
- **Code contributions**: Pull requests and bug fixes
- **Documentation**: Improving guides and references
- **Community support**: Helping other users
- **Feedback**: Providing constructive feedback
- **Testing**: Reporting bugs and testing features

## 📞 Getting Help

### Resources
- **Documentation**: Read through existing documentation
- **Issues**: Check existing GitHub issues
- **Discussions**: Ask questions in GitHub discussions
- **Community**: Join community channels

### Contact
- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For general questions
- **Email**: For private matters (if available)

---

*Thank you for contributing to the Shadowing Learning project! Your help makes this project better for everyone.*