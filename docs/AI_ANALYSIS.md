# AI Analysis Feature Documentation

## Overview

Ahtapot now includes AI-powered analysis capabilities that allow security professionals to get intelligent summaries, analyses, and detailed reports based on IOC (Indicator of Compromise) scan results from multiple threat intelligence providers.

## Supported AI Providers

### 1. Claude (Anthropic)
- **Model**: Claude Sonnet 4 (`claude-sonnet-4-20250514`)
- **Strengths**: Advanced reasoning, detailed analysis, excellent at security contexts
- **Pricing**: 
  - Input: $3 / MTok
  - Output: $15 / MTok
- **API Key URL**: https://console.anthropic.com/settings/keys
- **Note**: Requires payment method for API access (no free tier for API)

### 2. Gemini (Google)
- **Model**: Gemini 2.0 Flash (`gemini-2.0-flash`)
- **Strengths**: Fast processing, cost-effective, good for quick analysis
- **Pricing**:
  - Input: $0.10 / MTok
  - Output: $0.40 / MTok
- **Free Tier**: 15 RPM, 1M TPM, 1500 RPD
- **API Key URL**: https://aistudio.google.com/apikey

### 3. OpenAI (GPT)
- **Model**: GPT-4o Mini (`gpt-4o-mini`)
- **Strengths**: Versatile, reliable, well-documented
- **Pricing**:
  - Input: $0.15 / MTok
  - Output: $0.60 / MTok
- **API Key URL**: https://platform.openai.com/api-keys
- **Note**: Requires credit purchase

## Analysis Modes

### 📋 Summary Mode
Provides a concise executive summary from a Security Engineer's perspective:
- Overall risk assessment (Critical/High/Medium/Low/Info)
- Key findings across all providers
- Provider consensus summary
- 3-5 quick recommendations

Best for: Quick briefings, management reports, initial triage

### 🔍 Analysis Mode
Comprehensive analysis with actionable recommendations:
- Detailed indicator analysis by type (IP, Domain, Hash)
- Threat assessment table
- Immediate, short-term, and long-term action items
- Related indicators identification

Best for: Security team analysis, incident investigation planning

### 📊 Detailed Mode
Exhaustive deep-dive analysis with full technical details:
- Individual indicator deep-dive
- Cross-correlation analysis
- MITRE ATT&CK mapping
- Complete risk matrix
- Detection rule suggestions
- Incident response guidance
- Priority-based action items

Best for: Incident response, forensic analysis, threat hunting

## How to Configure

### Step 1: Open Settings
Click the ⚙️ settings icon in the Ahtapot sidepanel.

### Step 2: Navigate to API Keys Tab
Select the "API Keys" tab in the settings page.

### Step 3: Scroll to AI Providers Section
The AI Providers section is located below the security tool API keys.

### Step 4: Get an API Key
For each provider you want to use:
1. Click the info (ℹ️) button to expand setup instructions
2. Click the signup link to create an account
3. Follow provider-specific steps (e.g., add payment method)
4. Copy your API key

### Step 5: Save the API Key
1. Paste the API key in the input field
2. Click "Save" when the button appears
3. Verify the "Saved successfully" message

## How to Use

### Step 1: Analyze IOCs
Enter your IOCs in the search field and click analyze. Wait for results from security providers.

### Step 2: Use AI Analysis
Once results are loaded:
1. The AI Analysis section appears above the provider slider
2. Select your preferred AI provider (buttons)
3. Choose analysis mode from the dropdown (Summary/Analysis/Detailed)
4. Click "Analyze" to start

### Step 3: View Results
- AI results appear at the top with a purple gradient border
- Click the card header to expand/collapse
- Use the copy button to copy the full analysis
- Provider results are automatically collapsed when AI results arrive
- Click "Analysis Results" header to expand provider results

## File Structure

```
src/
├── types/
│   └── ai.ts                    # AI types, enums, and configurations
├── services/
│   └── ai/
│       ├── AIService.ts         # Main AI service with provider integrations
│       ├── index.ts             # AI services exports
│       └── prompts/
│           ├── summary.ts       # Summary mode prompt
│           ├── analysis.ts      # Analysis mode prompt
│           ├── detailed.ts      # Detailed mode prompt
│           └── index.ts         # Prompts exports
├── utils/
│   └── aiKeyStorage.ts          # AI API key storage utilities
├── components/
│   ├── AIAnalysisSection.tsx    # AI provider/mode selector component
│   ├── AIAnalysisSection.css    # AI section styles
│   ├── AIProviderSettings.tsx   # Settings page AI configuration
│   ├── AIProviderSettings.css   # AI settings styles
│   └── results/
│       ├── AIResultCard.tsx     # AI result display component
│       └── AIResultCard.css     # AI result card styles
└── i18n/
    └── locales/
        ├── en/
        │   ├── sidepanel.json   # English sidepanel translations (ai section)
        │   └── options.json     # English options translations (ai section)
        └── tr/
            ├── sidepanel.json   # Turkish sidepanel translations (ai section)
            └── options.json     # Turkish options translations (ai section)
```

## Customizing Prompts

The AI prompts are located in `src/services/ai/prompts/`. Each prompt file contains:

- `SYSTEM_PROMPT`: Defines the AI's persona and output guidelines
- `USER_PROMPT`: The actual analysis request with placeholders
- `buildPrompt()`: Function that combines prompts with IOC data

To customize analysis output:
1. Edit the relevant prompt file
2. Modify the output structure in USER_PROMPT
3. Adjust the system prompt persona if needed

## API Response Handling

The AI service handles responses from all three providers:

```typescript
// Claude (Anthropic)
response.content[0].text

// Gemini (Google)
response.candidates[0].content.parts[0].text

// OpenAI
response.choices[0].message.content
```

## Error Handling

The system handles various error scenarios:
- Missing API key: Prompts user to configure in settings
- API rate limits: Displays provider-specific error message
- Network errors: Shows generic error with retry option
- Invalid API key: Displays validation error

## Security Considerations

1. **API Key Storage**: Keys are stored locally in Chrome storage, never sent to external servers except the respective AI provider
2. **Data Privacy**: IOC data is only sent to the selected AI provider
3. **No Logging**: The extension does not log or store AI responses externally

## Pricing Comparison

| Provider | Input Cost | Output Cost | Free Tier |
|----------|------------|-------------|-----------|
| Claude | $3/MTok | $15/MTok | No |
| Gemini | $0.10/MTok | $0.40/MTok | Yes (limited) |
| OpenAI | $0.15/MTok | $0.60/MTok | No |

**Recommendation**: 
- For budget-conscious users: Gemini (free tier available)
- For advanced analysis: Claude (best reasoning)
- For balanced approach: OpenAI GPT-4o Mini

## Troubleshooting

### "Please configure an API key"
- Go to Settings > API Keys
- Scroll to AI Providers section
- Add your API key for the selected provider

### "API error: 401"
- API key is invalid or expired
- Generate a new key from the provider's console

### "API error: 429"
- Rate limit exceeded
- Wait a few minutes before retrying
- Consider upgrading your plan

### Analysis takes too long
- Detailed mode processes more data
- Try Summary mode for faster results
- Check your internet connection

## Future Improvements

Planned enhancements:
- [ ] Streaming responses for real-time analysis display
- [ ] Custom prompt templates
- [ ] Analysis history storage
- [ ] Comparison between AI providers
- [ ] Export analysis reports (PDF, Markdown)

