# AI Chatbot Module

This module adds AI chatbot functionality to the Discord bot using OpenAI-compatible APIs.

## Features

### 🤖 AI Chatbot
- **OpenAI-Compatible APIs**: Works with OpenAI, Anthropic Claude, local LLMs, and other compatible endpoints
- **Automatic Responses**: Responds to messages based on configurable probability
- **Direct Chat**: `/ask` command for direct AI interaction
- **Mention Support**: Always responds when bot is mentioned (configurable)

### ⚙️ Configuration
- **API Settings**: Configurable API URL, key, and model
- **Channel Control**: Whitelist/blacklist specific channels
- **Response Behavior**: Adjustable response chance percentage
- **Advanced Parameters**: Temperature, max tokens, message length limits
- **Custom Prompts**: Configurable system prompts for AI personality

### 🛡️ Moderation & Limits
- **Cooldowns**: Per-user cooldowns to prevent spam
- **Channel Restrictions**: Control which channels the bot can respond in
- **Message Length Limits**: Configurable maximum response length
- **Error Handling**: Graceful handling of API errors and rate limits

## Setup Instructions

### 1. Enable the Chatbot
```
/chatbot toggle enabled:True
```

### 2. Configure API Connection
```
/chatbot api url:https://api.openai.com/v1 key:your-api-key model:gpt-3.5-turbo
```

### 3. Set Behavior (Optional)
```
/chatbot behavior chance:25 require-mention:False cooldown:5
```

### 4. Configure Channels (Optional)
```
/chatbot channels mode:whitelist channel:#general action:add
```

### 5. Test Configuration
```
/chatbot test
```

## Commands

### `/chatbot` - Main configuration command
- **`status`** - Show current chatbot configuration
- **`toggle`** - Enable/disable the chatbot
- **`api`** - Configure API connection settings
- **`behavior`** - Set response behavior options
- **`channels`** - Manage channel permissions
- **`advanced`** - Configure AI parameters
- **`prompt`** - Set custom system prompt
- **`test`** - Test API connection

### `/ask` - Direct AI interaction
- Send a message directly to the AI chatbot
- Respects cooldowns and permissions
- Provides immediate response in embed format

## Supported API Providers

### OpenAI
```
URL: https://api.openai.com/v1
Models: gpt-3.5-turbo, gpt-4, gpt-4-turbo
```

### Anthropic Claude (via compatible proxy)
```
URL: https://api.anthropic.com/v1 (or proxy URL)
Models: claude-3-haiku, claude-3-sonnet, claude-3-opus
```

### Local LLMs (Ollama, LM Studio, etc.)
```
URL: http://localhost:11434/v1 (Ollama example)
URL: http://localhost:1234/v1 (LM Studio example)
Models: llama2, codellama, mistral, etc.
```

### Other Compatible Services
- Groq
- Together AI
- Replicate
- Any service that implements OpenAI's chat completions API

## Configuration Examples

### Basic Setup (OpenAI)
```bash
/chatbot toggle enabled:True
/chatbot api url:https://api.openai.com/v1 key:sk-your-key-here model:gpt-3.5-turbo
/chatbot behavior chance:15 cooldown:10
```

### Local LLM Setup (Ollama)
```bash
/chatbot toggle enabled:True
/chatbot api url:http://localhost:11434/v1 key:ollama model:llama2
/chatbot behavior chance:30 require-mention:False
```

### Restricted to Specific Channel
```bash
/chatbot channels mode:whitelist
/chatbot channels mode:whitelist channel:#ai-chat action:add
/chatbot channels mode:whitelist channel:#general action:add
```

### Custom Personality
```bash
/chatbot prompt text:You are a helpful music bot assistant. You love music and are knowledgeable about different genres, artists, and music theory. Always be enthusiastic about music discussions and provide helpful recommendations.
```

## Settings Reference

### Basic Settings
- **enabled**: Enable/disable the chatbot (default: false)
- **apiUrl**: API endpoint URL (default: https://api.openai.com/v1)
- **apiKey**: API authentication key (required)
- **model**: AI model to use (default: gpt-3.5-turbo)

### Behavior Settings
- **responseChance**: Percentage chance to respond (0-100, default: 10)
- **requireMention**: Only respond when mentioned (default: false)
- **cooldown**: Cooldown between responses in seconds (1-60, default: 5)
- **ignoreBots**: Ignore messages from other bots (default: true)

### Channel Settings
- **channelMode**: How to handle channels (all/whitelist/blacklist, default: all)
- **whitelistedChannels**: Channels where bot can respond (whitelist mode)
- **blacklistedChannels**: Channels where bot cannot respond (blacklist mode)

### Advanced Settings
- **maxTokens**: Maximum tokens in AI response (50-4000, default: 500)
- **temperature**: AI creativity level (0.0-2.0, default: 0.7)
- **maxMessageLength**: Maximum Discord message length (100-2000, default: 2000)
- **systemPrompt**: Custom system prompt for AI personality

## Error Handling

The bot gracefully handles various error conditions:

- **401 Unauthorized**: Invalid API key
- **429 Rate Limited**: Too many requests
- **400 Bad Request**: Invalid parameters
- **Timeout**: Request took too long
- **Network Errors**: Connection issues

Error messages are user-friendly and provide guidance on resolution.

## Database Schema Addition

The chatbot settings are stored in the Guild schema under the `chatbot` field:

```javascript
chatbot: {
    enabled: Boolean,
    apiUrl: String,
    apiKey: String,
    model: String,
    maxTokens: Number,
    temperature: Number,
    systemPrompt: String,
    responseChance: Number,
    channelMode: String, // 'all', 'whitelist', 'blacklist'
    whitelistedChannels: [String],
    blacklistedChannels: [String],
    ignoreBots: Boolean,
    requireMention: Boolean,
    cooldown: Number,
    maxMessageLength: Number
}
```

## Security Considerations

- API keys are stored in the database - ensure your MongoDB is secure
- Consider using environment variables for sensitive default values
- Implement rate limiting to prevent API abuse
- Monitor API usage and costs
- Regularly rotate API keys

## Troubleshooting

### Bot Not Responding
1. Check if chatbot is enabled: `/chatbot status`
2. Verify API key is set: `/chatbot test`
3. Check channel permissions
4. Verify response chance is > 0
5. Check if user is on cooldown

### API Errors
1. Test connection: `/chatbot test`
2. Verify API URL format
3. Check API key validity
4. Ensure model name is correct
5. Check API provider status

### Performance Issues
1. Reduce max tokens for faster responses
2. Increase cooldown to reduce API calls
3. Lower response chance percentage
4. Use faster/cheaper models
5. Implement channel restrictions

## Contributing

When adding new features to the chatbot module:

1. Update the schema in `Guild.js`
2. Add command options to `chatbot.js`
3. Implement functionality in `ChatBot.js`
4. Update help text and documentation
5. Test with multiple API providers
6. Consider backwards compatibility
