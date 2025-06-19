# AI Chatbot Configuration Examples

## Quick Start

### 1. Enable the chatbot
```bash
/chatbot toggle enabled:True
```

### 2. Configure OpenAI
```bash
/chatbot api url:https://api.openai.com/v1 key:sk-your-openai-key-here model:gpt-3.5-turbo
```

### 3. Set basic behavior
```bash
/chatbot behavior chance:15 cooldown:10
```

### 4. Test the configuration
```bash
/chatbot test
```

## Common Configurations

### Conservative Setup (Low Activity)
- Responds 5% of the time
- Higher cooldown
- Requires mention for guaranteed response

```bash
/chatbot toggle enabled:True
/chatbot api url:https://api.openai.com/v1 key:YOUR_KEY model:gpt-3.5-turbo
/chatbot behavior chance:5 require-mention:True cooldown:30
/chatbot advanced max-tokens:300 temperature:0.5
```

### Active Setup (High Engagement)
- Responds 25% of the time
- Lower cooldown
- More creative responses

```bash
/chatbot toggle enabled:True
/chatbot api url:https://api.openai.com/v1 key:YOUR_KEY model:gpt-4
/chatbot behavior chance:25 require-mention:False cooldown:5
/chatbot advanced max-tokens:800 temperature:0.9
```

### Channel-Specific Setup
- Only responds in designated channels
- Good for busy servers

```bash
/chatbot toggle enabled:True
/chatbot api url:https://api.openai.com/v1 key:YOUR_KEY model:gpt-3.5-turbo
/chatbot channels mode:whitelist
/chatbot channels mode:whitelist channel:#ai-chat action:add
/chatbot channels mode:whitelist channel:#general action:add
/chatbot behavior chance:30 cooldown:8
```

## API Provider Examples

### OpenAI
```bash
/chatbot api url:https://api.openai.com/v1 key:sk-your-key model:gpt-3.5-turbo
# or
/chatbot api url:https://api.openai.com/v1 key:sk-your-key model:gpt-4
```

### Local Ollama
```bash
/chatbot api url:http://localhost:11434/v1 key:ollama model:llama2
# or
/chatbot api url:http://localhost:11434/v1 key:ollama model:mistral
```

### LM Studio
```bash
/chatbot api url:http://localhost:1234/v1 key:lm-studio model:local-model
```

### Anthropic Claude (via proxy)
```bash
/chatbot api url:https://your-claude-proxy.com/v1 key:your-anthropic-key model:claude-3-haiku
```

## Custom Personality Examples

### Music Bot Assistant
```bash
/chatbot prompt text:You are a helpful music bot assistant. You're passionate about music of all genres and love helping users discover new songs, artists, and albums. Always be enthusiastic about music discussions and provide helpful recommendations when asked.
```

### Gaming Community Bot
```bash
/chatbot prompt text:You are a friendly gaming community assistant. You're knowledgeable about various video games, gaming news, and gaming culture. Help users with game recommendations, gaming tips, and foster positive discussions about gaming.
```

### Study/Educational Bot
```bash
/chatbot prompt text:You are a supportive educational assistant. Help users with their studies, provide explanations for complex topics, and encourage learning. Be patient, clear in your explanations, and always encourage curiosity and critical thinking.
```

### Creative Community Bot
```bash
/chatbot prompt text:You are an inspiring creative assistant. You help with art, writing, design, and other creative endeavors. Provide constructive feedback, creative prompts, and encouragement to community members pursuing their artistic goals.
```

## Advanced Configuration Examples

### High-Performance Setup
```bash
/chatbot advanced max-tokens:200 temperature:0.3 max-length:1000
/chatbot behavior cooldown:3
```

### Creative Writing Setup
```bash
/chatbot advanced max-tokens:1500 temperature:1.2 max-length:2000
/chatbot behavior cooldown:15
```

### Technical Support Setup
```bash
/chatbot advanced max-tokens:600 temperature:0.1 max-length:1500
/chatbot prompt text:You are a technical support assistant. Provide clear, step-by-step solutions to technical problems. Ask clarifying questions when needed and always prioritize user safety and data security.
```

## Moderation and Control

### Strict Moderation
```bash
/chatbot channels mode:whitelist
/chatbot channels mode:whitelist channel:#bot-testing action:add
/chatbot behavior chance:10 require-mention:True cooldown:60
```

### Blacklist Problematic Channels
```bash
/chatbot channels mode:blacklist
/chatbot channels mode:blacklist channel:#serious-discussion action:add
/chatbot channels mode:blacklist channel:#announcements action:add
```

### Reset Configuration
```bash
/chatbot toggle enabled:False
/chatbot channels mode:all action:clear
/chatbot behavior chance:10 require-mention:False cooldown:5
/chatbot advanced max-tokens:500 temperature:0.7 max-length:2000
```

## Troubleshooting Commands

### Check Current Status
```bash
/chatbot status
```

### Test API Connection
```bash
/chatbot test
```

### Reset to Defaults
```bash
/chatbot api url:https://api.openai.com/v1 model:gpt-3.5-turbo
/chatbot behavior chance:10 require-mention:False cooldown:5
/chatbot advanced max-tokens:500 temperature:0.7
/chatbot channels mode:all action:clear
```

## Performance Optimization

### For High-Traffic Servers
```bash
/chatbot behavior chance:5 cooldown:30
/chatbot advanced max-tokens:300
/chatbot channels mode:whitelist
# Add only specific channels
```

### For Low-Cost Usage
```bash
/chatbot api model:gpt-3.5-turbo  # Use cheaper model
/chatbot advanced max-tokens:200  # Reduce token usage
/chatbot behavior chance:5        # Reduce frequency
```

### For Better Responses
```bash
/chatbot api model:gpt-4          # Use better model
/chatbot advanced max-tokens:800  # Allow longer responses
/chatbot advanced temperature:0.8 # More creative
```

## Monitoring and Maintenance

Remember to:
1. Monitor your API usage and costs
2. Adjust response chance based on server activity
3. Update prompts based on community feedback
4. Regularly test the API connection
5. Review and adjust channel restrictions as needed

Use `/chatbot status` regularly to check your current configuration and ensure everything is working as expected.
