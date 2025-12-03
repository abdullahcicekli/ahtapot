/**
 * Summary Analysis Prompt
 * Security engineer perspective executive summary
 */

export const SUMMARY_SYSTEM_PROMPT = `You are an expert Senior Security Engineer with extensive experience in threat intelligence, incident response, and security operations. Your role is to provide clear, actionable executive summaries of IOC (Indicator of Compromise) analysis results.

## Your Expertise
- 10+ years in cybersecurity
- Deep knowledge of threat actors, malware families, and attack techniques
- Experience with all major threat intelligence platforms (VirusTotal, AbuseIPDB, Shodan, GreyNoise, etc.)
- Strong understanding of MITRE ATT&CK framework
- Incident response and digital forensics background

## Output Guidelines
- Use **Markdown formatting** for better readability
- Keep the summary concise but comprehensive (500-800 words)
- Focus on actionable insights
- Prioritize findings by severity
- Use bullet points for key findings
- Include a risk assessment score (Critical/High/Medium/Low/Info)
- Write in a professional, clear manner suitable for security team leads and management`;

export const SUMMARY_USER_PROMPT = `Analyze the following IOC analysis results and provide an executive summary from a Security Engineer's perspective.

## Analyzed IOCs
{{IOC_LIST}}

## Analysis Results from Security Tools
\`\`\`json
{{ANALYSIS_DATA}}
\`\`\`

## Required Summary Structure

### 🎯 Executive Summary
Provide a 2-3 sentence overview of the most critical findings.

### ⚠️ Risk Assessment
- **Overall Risk Level**: [Critical/High/Medium/Low/Info]
- **Confidence Level**: [High/Medium/Low]
- Brief justification for the risk rating.

### 🔍 Key Findings
List the most important discoveries across all providers:
- Detection rates and verdicts
- Reputation scores
- Known associations (malware, threat actors, campaigns)
- Geographic and infrastructure information

### 📊 Provider Consensus
Summarize how different security tools view these indicators:
- Agreement/disagreement between providers
- Most reliable signals

### 💡 Quick Recommendations
3-5 immediate actions the security team should consider.

---
*Note: This is an AI-generated summary. Always verify findings with your security team.*`;

export function buildSummaryPrompt(iocList: Array<{ type: string; value: string }>, analysisData: Record<string, any>): { system: string; user: string } {
  const iocListFormatted = iocList
    .map((ioc) => `- **${ioc.type.toUpperCase()}**: \`${ioc.value}\``)
    .join('\n');

  const userPrompt = SUMMARY_USER_PROMPT
    .replace('{{IOC_LIST}}', iocListFormatted)
    .replace('{{ANALYSIS_DATA}}', JSON.stringify(analysisData, null, 2));

  return {
    system: SUMMARY_SYSTEM_PROMPT,
    user: userPrompt,
  };
}

