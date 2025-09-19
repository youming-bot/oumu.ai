# Troubleshooting

This guide helps you resolve common issues with the Shadowing Learning application.

## 🔍 Quick Fixes

### General Issues
```bash
# Clear browser cache and refresh
Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

# Clear IndexedDB data
# Browser DevTools > Application > Storage > IndexedDB > Clear

# Disable browser extensions temporarily
# Some extensions may interfere with audio processing
```

## 🚫 Common Error Messages

### API Key Issues
```
Error: "Missing GROQ_API_KEY"
```
**Solution:**
1. Check `.env.local` file contains `GROQ_API_KEY`
2. Verify API key is valid and has credits
3. Restart development server: `npm run dev`

### Audio Processing Issues
```
Error: "Audio processing failed"
```
**Solution:**
1. Check audio file format (MP3, WAV, M4A supported)
2. Verify file size is reasonable (< 100MB)
3. Try a different audio file
4. Check browser console for specific error details

### Transcription Issues
```
Error: "Transcription timeout"
```
**Solution:**
1. Check internet connection
2. Verify Groq API is accessible
3. Reduce audio file size or split into smaller chunks
4. Check API key usage limits

## 🎵 Audio Playback Issues

### No Sound
1. **Check volume**: Ensure system volume is up
2. **Browser permissions**: Allow audio autoplay in browser settings
3. **Audio format**: Try converting to MP3 format
4. **Browser compatibility**: Try different browser

### Audio Out of Sync
1. **Refresh page**: Clear and reload the application
2. **Clear cache**: Clear browser cache and IndexedDB
3. **Reprocess file**: Delete and re-upload the audio file
4. **Check file integrity**: Verify audio file isn't corrupted

### Playback Controls Not Working
1. **Refresh browser**: Sometimes controls get stuck
2. **Clear IndexedDB**: Reset application state
3. **Check console**: Look for JavaScript errors
4. **Try different browser**: Rule out browser-specific issues

## 📊 File Upload Issues

### Upload Fails
```
Error: "File upload failed"
```
**Solution:**
1. Check file size limit (max 100MB)
2. Verify file format is supported
3. Check browser storage permissions
4. Clear browser cache and try again

### File Processing Stuck
```
Status: "Processing..." for long time
```
**Solution:**
1. Check internet connection
2. Verify API keys are valid
3. Monitor browser console for errors
4. Try uploading a smaller file first

### No Transcription Results
```
Error: "No transcription data available"
```
**Solution:**
1. Check transcription completed successfully
2. Verify file has clear audio
3. Try reprocessing the file
4. Check API credits and usage limits

## 🌐 Browser Compatibility

### Supported Browsers
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### Browser-Specific Issues

#### Safari
```bash
# Enable cross-origin resource sharing
# Safari > Preferences > Privacy > Cross-site tracking
# Uncheck "Prevent cross-site tracking"
```

#### Firefox
```bash
# Enable IndexedDB
# about:config > dom.indexedDB.enabled > true
```

#### Mobile Browsers
- Use modern mobile browsers
- Ensure stable internet connection
- Some features may be limited on mobile

## 🔧 Development Issues

### TypeScript Errors
```bash
# Check types
npm run type-check

# Clean build
rm -rf .next node_modules/.cache
npm install
npm run build
```

### Test Failures
```bash
# Run specific test
npm test -- --testPathPattern=filename

# Run tests with verbose output
npm test -- --verbose

# Clear Jest cache
npm test -- --clearCache
```

### Build Issues
```bash
# Clean build
rm -rf .next out
npm install
npm run build

# Check dependencies
npm audit
npm install
```

## 📱 Performance Issues

### Slow Processing
1. **Large files**: Split into smaller chunks (< 10MB)
2. **Network speed**: Check internet connection
3. **Browser performance**: Close other tabs
4. **System resources**: Check memory and CPU usage

### Memory Issues
1. **Large files**: Process smaller files
2. **Browser tabs**: Close unused tabs
3. **Browser restart**: Restart browser periodically
4. **System restart**: Restart computer if needed

## 🔄 Data Issues

### Lost Files/Transcriptions
1. **Check IndexedDB**: Browser DevTools > Application > Storage
2. **Clear cache**: Sometimes resolves corruption
3. **Reupload**: Files may need to be reprocessed
4. **Export data**: Export important data regularly

### Corrupted Data
```bash
# Clear IndexedDB completely
# Browser DevTools > Application > Storage > IndexedDB
# Right-click > Delete database

# Refresh application
# Reupload files
```

## 🛠️ Advanced Troubleshooting

### Debug Mode
```javascript
// Enable debug logging in browser console
localStorage.setItem('debug', 'shadowing-learning:*');

// Refresh page
```

### Network Issues
1. **Check CORS**: Verify API endpoints are accessible
2. **Proxy settings**: Check network proxy configuration
3. **Firewall**: Ensure no firewall blocking requests
4. **VPN**: Try disabling VPN temporarily

### API Rate Limits
1. **Check usage**: Monitor API usage in dashboards
2. **Upgrade plan**: Consider upgrading API plans
3. **Reduce concurrency**: Lower MAX_CONCURRENCY setting
4. **Batch processing**: Process files sequentially

## 📞 Getting Help

### Self-Help Resources
1. **Browser console**: Check for error messages
2. **Network tab**: Monitor API requests
3. **Application tab**: Inspect IndexedDB data
4. **Documentation**: Review relevant documentation

### Community Support
1. **GitHub Issues**: Search existing issues
2. **Discussions**: Ask questions in GitHub discussions
3. **Stack Overflow**: Search for related questions
4. **Community forums**: Join relevant communities

### Reporting Issues
When reporting issues, include:
1. **Browser and version**: Chrome 120, Firefox 115, etc.
2. **Operating system**: Windows 11, macOS 14, Ubuntu 22.04
3. **Steps to reproduce**: Detailed reproduction steps
4. **Error messages**: Full error text and stack traces
5. **Console logs**: Browser console output
6. **Network requests**: Failed API requests
7. **Screenshots**: Visual evidence of the issue

## 🔄 Prevention Tips

### Regular Maintenance
1. **Clear cache**: Periodically clear browser cache
2. **Update browser**: Keep browser updated
3. **Monitor usage**: Track API usage and limits
4. **Backup data**: Export important transcriptions

### Best Practices
1. **File management**: Keep files organized
2. **Regular saves**: Save work frequently
3. **Quality files**: Use high-quality audio files
4. **Stable internet**: Ensure reliable connection

### Performance Optimization
1. **File sizes**: Keep files manageable
2. **Browser management**: Close unused tabs
3. **System resources**: Monitor memory usage
4. **Network optimization**: Use stable connection

---

*This guide is part of the User Guide series. See [User Guide](README.md) for more resources.*