# First Steps Guide

This guide walks you through the essential first steps to get started with the Shadowing Learning application, whether you're a new user or a developer.

## 🎯 What You'll Accomplish

By the end of this guide, you will:
- ✅ Upload your first audio file
- ✅ Process transcription and subtitles
- ✅ Use the basic learning features
- ✅ Export your learning materials

---

## 🚀 Quick Start for Users

### Step 1: Upload Your First Audio File

1. **Open the Application**
   - Navigate to `http://localhost:3000` (local development)
   - Or visit the hosted application URL

2. **Upload Audio**
   - Drag and drop an audio file onto the upload area
   - Or click "Browse" to select a file manually

   **Supported Formats**: MP3, WAV, M4A, OGG
   **Maximum Size**: 100MB

3. **Monitor Progress**
   - Watch the progress bar
   - Processing typically takes 1-3 minutes per 10 minutes of audio

### Step 2: Explore the Interface

Once processing is complete:

1. **Audio Player** (Bottom)
   - Play/pause controls
   - Progress bar with click-to-seek
   - Volume control
   - Playback speed adjustment

2. **Subtitle Display** (Center)
   - Synchronized text with audio
   - Current sentence highlighting
   - Click any sentence to jump to that position

3. **File Management** (Sidebar)
   - List of uploaded files
   - Processing status indicators
   - Delete unwanted files

### Step 3: Basic Learning Workflow

1. **Listen and Read**
   - Play the audio while reading subtitles
   - Notice how text highlights in sync with speech

2. **Practice Shadowing**
   - Listen to a sentence
   - Pause and repeat aloud
   - Compare your pronunciation

3. **Use A-B Loop**
   - Set loop points (A and B)
   - Repeat difficult sections
   - Practice until comfortable

---

## 💻 First Steps for Developers

### Step 1: Verify Your Setup

```bash
# Check that everything is working
npm run dev
```

Navigate to `http://localhost:3000` and verify:
- ✅ Application loads without errors
- ✅ File upload component appears
- ✅ No console errors

### Step 2: Test the Core Features

1. **Test File Upload**
   ```bash
   # Use a test audio file
   cp test/fixtures/sample-audio.mp3 .

   # Upload through the UI
   # Verify file appears in the list
   ```

2. **Test Transcription**
   - Wait for processing to complete
   - Check that subtitles appear
   - Verify audio-text synchronization

3. **Run Developer Tests**
   ```bash
   # Run the test suite
   npm test

   # Check code quality
   npm run lint

   # Verify TypeScript types
   npm run type-check
   ```

### Step 3: Explore the Codebase

#### Key Files to Understand
```bash
# Main application structure
src/app/page.tsx              # Main application page
src/app/layout.tsx            # Root layout

# Core components
src/components/audio-player.tsx    # Audio playback
src/components/subtitle-display.tsx # Subtitle rendering
src/components/file-upload.tsx     # File handling

# Business logic
src/lib/transcription-service.ts   # Transcription logic
src/lib/subtitle-sync.ts          # Synchronization
src/lib/db.ts                     # Database operations
```

#### API Routes
```bash
src/app/api/transcribe/route.ts    # Groq transcription
src/app/api/postprocess/route.ts   # Text processing
src/app/api/progress/route.ts      # Progress tracking
```

---

## 🎯 Common First Tasks

### For Users

#### Task 1: Process a Podcast Episode
1. Find a short podcast (3-5 minutes)
2. Upload and process it
3. Practice shadowing key phrases
4. Export subtitles for review

#### Task 2: Create Study Materials
1. Upload educational content
2. Process and review subtitles
3. Identify vocabulary to learn
4. Save to terminology glossary

#### Task 3: Practice Pronunciation
1. Choose content with clear speech
2. Use A-B loop for difficult words
3. Record yourself comparing
4. Repeat until confident

### For Developers

#### Task 1: Make Your First Change
```bash
# Create a new branch
git checkout -b feature/small-improvement

# Make a simple change (e.g., update text)
# Edit src/components/subtitle-display.tsx

# Test your change
npm run dev

# Commit and push
git add .
git commit -m "Update subtitle display text"
git push origin feature/small-improvement
```

#### Task 2: Add a New Feature
1. **Understand Requirements**: What should the feature do?
2. **Plan Implementation**: Which files need changes?
3. **Write Tests**: Create tests first (TDD approach)
4. **Implement Code**: Write the feature code
5. **Test Thoroughly**: Verify all functionality
6. **Update Documentation**: Document the new feature

#### Task 3: Fix a Bug
1. **Reproduce the Bug**: Understand the issue
2. **Find Root Cause**: Locate problematic code
3. **Write Test Case**: Create test that reproduces bug
4. **Implement Fix**: Solve the underlying issue
5. **Verify Fix**: Ensure bug is resolved
6. **Check for Regressions**: Run full test suite

---

## 🔧 Troubleshooting Common Issues

### Installation Problems
```bash
# If npm install fails
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### API Key Issues
```bash
# Verify API keys are set
echo $GROQ_API_KEY
echo $OPENROUTER_API_KEY

# If missing, add to .env.local
echo "GROQ_API_KEY=your_key" >> .env.local
```

### Audio Processing Issues
- **Problem**: File won't upload
- **Solution**: Check file format and size limits

- **Problem**: Transcription fails
- **Solution**: Verify API keys and credits

- **Problem**: Subtitles out of sync
- **Solution**: Refresh and reprocess the file

---

## 📚 Learning Resources

### Official Documentation
- [User Guide](../user-guide/README.md)
- [API Reference](../api-reference/README.md)
- [Architecture Overview](../architecture/README.md)

### Community Resources
- [GitHub Discussions](https://github.com/your-repo/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/shadowing-learning)
- [Discord Community](https://discord.gg/shadowing-learning)

### Video Tutorials
- [Getting Started Walkthrough](https://youtube.com/playlist?list=...)
- [Advanced Features Tutorial](https://youtube.com/watch?v=...)
- [Developer Setup Guide](https://youtube.com/watch?v=...)

---

## 🎉 Next Steps

### For Users
- Explore [Advanced Features](../user-guide/features.md)
- Learn [Common Workflows](../user-guide/workflows.md)
- Join the [Community](https://discord.gg/shadowing-learning)

### For Developers
- Set up [Development Environment](../development/setup.md)
- Understand [Project Structure](../architecture/components.md)
- Review [Coding Standards](../development/coding-standards.md)

### For Contributors
- Read [Contributing Guidelines](../appendices/contributing.md)
- Find [Good First Issues](https://github.com/your-repo/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22)
- Join [Development Discussions](https://github.com/your-repo/discussions)

---

## 💡 Pro Tips

### User Tips
- **Start Small**: Begin with short audio files (1-3 minutes)
- **Quality Matters**: Use clear, high-quality audio sources
- **Consistency**: Practice regularly for best results
- **Patience**: Processing time varies with file length

### Developer Tips
- **Read the Code**: Understand existing patterns before changing
- **Test Everything**: Run tests before committing
- **Ask Questions**: Use GitHub discussions for help
- **Start Small**: Begin with simple improvements

---

🎉 **Congratulations!** You've completed your first steps with Shadowing Learning. You're now ready to explore more advanced features and contribute to the project.

---

*Need help? Check the [Troubleshooting](../user-guide/troubleshooting.md) section or create an issue on GitHub.*