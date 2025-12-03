/**
 * AI Result Card Component
 * Displays AI analysis results with markdown rendering
 */

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Clock, Copy, Check, AlertCircle } from 'lucide-react';
import { AIAnalysisResult, AIAnalysisMode, AI_PROVIDER_CONFIGS, AI_ANALYSIS_MODE_CONFIG } from '@/types/ai';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import './AIResultCard.css';

interface AIResultCardProps {
  result: AIAnalysisResult;
  defaultExpanded?: boolean;
}

export const AIResultCard: React.FC<AIResultCardProps> = ({ result, defaultExpanded = true }) => {
  const { t } = useTranslation('sidepanel');
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  const providerConfig = AI_PROVIDER_CONFIGS[result.provider];
  const modeConfig = AI_ANALYSIS_MODE_CONFIG[result.mode];

  const formattedTime = useMemo(() => {
    const date = new Date(result.timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [result.timestamp]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getModeLabel = (mode: AIAnalysisMode): string => {
    switch (mode) {
      case AIAnalysisMode.SUMMARY:
        return t('ai.modes.summary');
      case AIAnalysisMode.ANALYSIS:
        return t('ai.modes.analysis');
      case AIAnalysisMode.DETAILED:
        return t('ai.modes.detailed');
      default:
        return mode;
    }
  };

  // Simple markdown to HTML converter
  const renderMarkdown = (content: string): string => {
    let html = content
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Horizontal rule
      .replace(/^---$/gim, '<hr>')
      // Unordered lists
      .replace(/^\s*[-*]\s+(.*)$/gim, '<li>$1</li>')
      // Ordered lists
      .replace(/^\s*\d+\.\s+(.*)$/gim, '<li>$1</li>')
      // Tables (basic support)
      .replace(/\|(.+)\|/g, (match, content) => {
        const cells = content.split('|').map((cell: string) => cell.trim());
        if (cells.every((cell: string) => /^[-:]+$/.test(cell))) {
          return ''; // Skip separator row
        }
        const cellTags = cells.map((cell: string) => `<td>${cell}</td>`).join('');
        return `<tr>${cellTags}</tr>`;
      })
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    // Wrap list items
    html = html.replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>');

    // Wrap in paragraphs
    html = '<p>' + html + '</p>';

    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p>\s*<(h[1-6]|ul|ol|pre|hr)/g, '<$1');
    html = html.replace(/<\/(h[1-6]|ul|ol|pre)>\s*<\/p>/g, '</$1>');

    return html;
  };

  if (result.error) {
    return (
      <div className="ai-result-card ai-result-error">
        <div className="ai-result-header" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="ai-result-header-left">
            <AlertCircle size={18} className="ai-result-error-icon" />
            <span className="ai-result-provider">{providerConfig.displayName}</span>
            <span className="ai-result-mode-badge error">{getModeLabel(result.mode)}</span>
          </div>
          <div className="ai-result-header-right">
            <span className="ai-result-time">
              <Clock size={12} />
              {formattedTime}
            </span>
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>

        {isExpanded && (
          <div className="ai-result-content ai-result-content-error">
            <p>{result.error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="ai-result-card">
      <div className="ai-result-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="ai-result-header-left">
          <Sparkles size={18} className="ai-result-icon" />
          <span className="ai-result-provider">{providerConfig.displayName}</span>
          <span className="ai-result-mode-badge" style={{ backgroundColor: `${modeConfig.color}20`, color: modeConfig.color }}>
            {modeConfig.icon} {getModeLabel(result.mode)}
          </span>
        </div>
        <div className="ai-result-header-right">
          <span className="ai-result-time">
            <Clock size={12} />
            {formattedTime}
          </span>
          <button
            className="ai-result-copy-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            title={t('ai.copyResult')}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {isExpanded && (
        <div className="ai-result-content">
          <div
            className="ai-result-markdown"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(result.content) }}
          />
        </div>
      )}
    </div>
  );
};

