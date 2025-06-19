# Test Suite

This folder contains all test files for the Discord Music Bot project.

## 🧪 Available Tests

### Core Functionality Tests
- [**test-chatbot.js**](test-chatbot.js) - AI chatbot module validation
- [**test-structure.js**](test-structure.js) - Project structure validation
- [**test-modlog.js**](test-modlog.js) - Moderation logging tests
- [**simple-test.js**](simple-test.js) - Basic bot functionality test

### Feature-Specific Tests
- [**test-youtube.js**](test-youtube.js) - YouTube integration tests
- [**test-playlist.js**](test-playlist.js) - Playlist functionality tests
- [**test-search-types.js**](test-search-types.js) - Search functionality tests

### Validation & Setup Tests
- [**check-token.js**](check-token.js) - Discord token validation
- [**validate-bot.js**](validate-bot.js) - Bot configuration validation

### Utility Scripts
- [**test-shutdown.sh**](test-shutdown.sh) - Shutdown testing script

## 🚀 Running Tests

### Individual Tests
```bash
# AI Chatbot tests
npm run test:chatbot

# Structure validation
npm run test:structure

# YouTube functionality
npm run test:youtube

# Moderation logging
npm run test:modlog

# Playlist features
npm run test:playlist

# Token validation
npm run check-token

# Bot validation
npm run validate
```

### All Tests
```bash
# Run Jest test suite
npm test

# Run all custom tests
npm run test:chatbot && npm run test:structure && npm run test:youtube
```

## 📋 Test Requirements

### Environment Variables
Most tests require these environment variables:
```env
DISCORD_TOKEN=your_discord_bot_token
MONGODB_URI=mongodb://localhost:27017/discord-music-bot
```

### Optional for API Tests
```env
OPENAI_API_KEY=your_openai_key
TEST_API_KEY=your_test_api_key
TEST_API_URL=https://api.example.com/v1
TEST_MODEL=test-model-name
```

## 🔧 Test Categories

### Unit Tests
- `test-chatbot.js` - Tests individual chatbot components
- `test-structure.js` - Validates file structure and dependencies

### Integration Tests
- `test-youtube.js` - Tests YouTube API integration
- `test-modlog.js` - Tests moderation logging integration

### Validation Tests
- `check-token.js` - Validates Discord token and permissions
- `validate-bot.js` - Validates overall bot configuration

### End-to-End Tests
- `simple-test.js` - Basic bot startup and functionality
- `test-playlist.js` - Complete playlist workflow testing

## 📊 Test Output

Tests provide detailed output including:
- ✅ Passed tests with descriptions
- ❌ Failed tests with error details
- ⏭️ Skipped tests with reasons
- 📊 Summary statistics
- 🔧 Configuration validation

## 🐛 Troubleshooting Tests

### Common Issues
1. **MongoDB Connection Failed**
   - Ensure MongoDB is running
   - Check MONGODB_URI environment variable

2. **Discord Token Invalid**
   - Verify DISCORD_TOKEN in .env file
   - Check bot permissions on Discord Developer Portal

3. **API Tests Failing**
   - Set optional API keys for external service tests
   - Check network connectivity

4. **File Not Found Errors**
   - Ensure all dependencies are installed: `npm install`
   - Verify file paths in test scripts

### Getting Help
1. Check the [main documentation](../docs/)
2. Review error messages carefully
3. Verify environment variables are set
4. Ensure all dependencies are installed
5. Check that the bot is properly configured

## 📝 Adding New Tests

When creating new tests:
1. Place them in this `test/` folder
2. Follow the naming convention: `test-feature.js`
3. Add npm script in `package.json` if needed
4. Update this README with test description
5. Include proper error handling and cleanup
6. Add configuration requirements

## 🏗️ Test Structure

```javascript
// Example test structure
const testName = require('./path/to/module');

async function runTests() {
    console.log('🧪 Testing Feature...\n');
    
    try {
        // Test setup
        console.log('1. Setting up test...');
        
        // Test execution
        console.log('2. Running test...');
        
        // Validation
        console.log('✅ Test passed');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

runTests();
```
