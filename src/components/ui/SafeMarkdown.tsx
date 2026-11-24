import React from 'react';

interface SafeMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Renders inline markdown (**bold**, *italic*, `code`) safely as React nodes.
 * Zero dangerouslySetInnerHTML usage.
 */
function renderInlineNodes(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Tokenize **bold**, *italic*, or `code`
  const tokenRegex = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let partIdx = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${partIdx++}`} className="font-bold text-slate-900 dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push(
        <em key={`${keyPrefix}-i-${partIdx++}`} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code
          key={`${keyPrefix}-c-${partIdx++}`}
          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-teal-800 dark:text-teal-300 text-[0.88em] font-mono"
        >
          {token.slice(1, -1)}
        </code>
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

/**
 * XSS-Safe Markdown Renderer for Assistant & Clinician Copilot messages.
 * Supports headings (# / ## / ###), bullet lists (-, *, •), numbered lists (1.), and inline bold/italic/code.
 */
export const SafeMarkdown: React.FC<SafeMarkdownProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let listItems: React.ReactNode[] = [];

  const flushList = (keyIdx: number) => {
    if (!listType || listItems.length === 0) return;
    if (listType === 'ul') {
      blocks.push(
        <ul key={`ul-${keyIdx}`} className="list-disc pl-5 space-y-1 my-1.5">
          {listItems}
        </ul>
      );
    } else {
      blocks.push(
        <ol key={`ol-${keyIdx}`} className="list-decimal pl-5 space-y-1 my-1.5">
          {listItems}
        </ol>
      );
    }
    listType = null;
    listItems = [];
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    if (!line) {
      flushList(idx);
      return;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushList(idx);
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      const headingClass =
        level === 1
          ? 'text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-3 mb-1'
          : level === 2
          ? 'text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-2.5 mb-1'
          : 'text-sm font-bold text-teal-800 dark:text-teal-300 mt-2 mb-0.5';
      blocks.push(
        <h4 key={`h-${idx}`} className={headingClass}>
          {renderInlineNodes(headingText, `h-${idx}`)}
        </h4>
      );
      return;
    }

    // Bullet list items (-, *, •)
    const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      if (listType !== 'ul') {
        flushList(idx);
        listType = 'ul';
      }
      listItems.push(
        <li key={`li-${idx}`} className="leading-relaxed">
          {renderInlineNodes(bulletMatch[1], `li-${idx}`)}
        </li>
      );
      return;
    }

    // Numbered list items (1. )
    const orderedMatch = line.match(/^\d+[.)]\s+(.+)$/);
    if (orderedMatch) {
      if (listType !== 'ol') {
        flushList(idx);
        listType = 'ol';
      }
      listItems.push(
        <li key={`oli-${idx}`} className="leading-relaxed">
          {renderInlineNodes(orderedMatch[1], `oli-${idx}`)}
        </li>
      );
      return;
    }

    // Regular paragraph line
    flushList(idx);
    blocks.push(
      <p key={`p-${idx}`} className="leading-relaxed my-1.5 first:mt-0 last:mb-0">
        {renderInlineNodes(line, `p-${idx}`)}
      </p>
    );
  });

  flushList(lines.length);

  return <div className={`space-y-1 ${className}`}>{blocks}</div>;
};
