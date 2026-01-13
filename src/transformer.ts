import type { BlockEntity } from './types';

/**
 * Check if content is a code fence (starts with ```)
 */
function isCodeFence(content: string): boolean {
  return content.trimStart().startsWith('```');
}

/**
 * Check if content is a property line (key:: value)
 */
function isPropertyLine(content: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9_-]*::/.test(content.trim());
}

/**
 * Check if content is preformatted and should not have whitespace collapsed
 */
function isPreformattedContent(content: string): boolean {
  const trimmed = content.trim();
  return (
    trimmed.startsWith('```') ||           // Code fence
    trimmed.startsWith('|') ||             // Table row
    trimmed === '---' ||                   // Horizontal rule
    trimmed.startsWith('    ')             // Indented code block
  );
}

/**
 * Check if content contains a table (has | characters suggesting table structure)
 */
function containsTable(content: string): boolean {
  const lines = content.split('\n');
  // A table needs at least 2 lines with | characters
  const tableLines = lines.filter(line => line.includes('|') && line.trim().startsWith('|'));
  return tableLines.length >= 2;
}

/**
 * Clean Logseq-specific syntax from content
 * - [[Page Link]] -> Page Link (plain text)
 * - {{embed [[page]]}} -> removed
 * - #tag -> removed
 * Preserves newlines and multi-line structure
 */
function cleanLogseqSyntax(content: string): string {
  let cleaned = content;

  // Remove embeds: {{embed [[page]]}} or {{embed ((block-ref))}}
  cleaned = cleaned.replace(/\{\{embed\s+\[\[[^\]]+\]\]\}\}/g, '');
  cleaned = cleaned.replace(/\{\{embed\s+\(\([^)]+\)\)\}\}/g, '');

  // Remove other macros: {{...}}
  cleaned = cleaned.replace(/\{\{[^}]+\}\}/g, '');

  // Convert page links: [[Page Link]] -> Page Link
  cleaned = cleaned.replace(/\[\[([^\]]+)\]\]/g, '$1');

  // Remove block references: ((block-ref))
  cleaned = cleaned.replace(/\(\([^)]+\)\)/g, '');

  // Remove tags: #tag or #[[multi word tag]]
  cleaned = cleaned.replace(/#\[\[[^\]]+\]\]/g, '');
  cleaned = cleaned.replace(/#[a-zA-Z0-9_-]+/g, '');

  // Clean up horizontal whitespace only (preserve newlines!)
  // Replace multiple spaces/tabs with single space, but keep newlines
  cleaned = cleaned.replace(/[^\S\n]+/g, ' ');

  // Remove trailing spaces on each line
  cleaned = cleaned.split('\n').map(line => line.trimEnd()).join('\n');

  // Limit consecutive blank lines to max 2
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Trim start and end
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Process a block and its children recursively
 * @param block - The block to process
 * @param depth - Current nesting depth (0 = top level)
 * @param isFirstTopLevel - Whether this is the first top-level block (for property handling)
 */
function processBlock(
  block: BlockEntity,
  depth: number,
  isFirstTopLevel: boolean
): string[] {
  const lines: string[] = [];
  const content = block.content || '';

  // Skip empty blocks
  if (!content.trim()) {
    return lines;
  }

  // Skip property lines at top level
  if (depth === 0 && isFirstTopLevel && isPropertyLine(content)) {
    // Process children even if this is a property block
    if (block.children && block.children.length > 0) {
      for (const child of block.children) {
        if (typeof child === 'object' && child !== null) {
          lines.push(...processBlock(child as BlockEntity, depth + 1, false));
        }
      }
    }
    return lines;
  }

  // Handle code fences - preserve COMPLETELY as-is (no cleaning)
  if (isCodeFence(content)) {
    if (depth === 0) {
      // Top level: output as-is
      lines.push(content);
      lines.push('');
    } else {
      // Nested: preserve but add list marker, handle multi-line
      const indent = '  '.repeat(depth - 1);
      const contentLines = content.split('\n');
      lines.push(`${indent}- ${contentLines[0]}`);
      for (let i = 1; i < contentLines.length; i++) {
        lines.push(`${indent}  ${contentLines[i]}`);
      }
    }
    // Skip children processing for code blocks - they shouldn't have children
    return lines;
  }

  // Handle preformatted content (tables, horizontal rules) - preserve structure
  if (isPreformattedContent(content) || containsTable(content)) {
    if (depth === 0) {
      // Top level: output as-is
      lines.push(content);
      lines.push('');
    } else {
      // Nested: preserve but add list marker for first line
      const indent = '  '.repeat(depth - 1);
      const contentLines = content.split('\n');
      lines.push(`${indent}- ${contentLines[0]}`);
      for (let i = 1; i < contentLines.length; i++) {
        lines.push(`${indent}  ${contentLines[i]}`);
      }
    }
  } else {
    // Regular content - clean Logseq syntax but preserve newlines
    const cleaned = cleanLogseqSyntax(content);

    if (cleaned) {
      if (depth === 0) {
        // Top level: output as paragraph (no bullet)
        lines.push(cleaned);
        lines.push('');
      } else {
        // Nested: output as list item with proper indentation
        const indent = '  '.repeat(depth - 1);
        // Handle multi-line content in nested blocks
        const contentLines = cleaned.split('\n');
        lines.push(`${indent}- ${contentLines[0]}`);
        for (let i = 1; i < contentLines.length; i++) {
          lines.push(`${indent}  ${contentLines[i]}`);
        }
      }
    }
  }

  // Process children
  if (block.children && block.children.length > 0) {
    for (const child of block.children) {
      if (typeof child === 'object' && child !== null) {
        lines.push(...processBlock(child as BlockEntity, depth + 1, false));
      }
    }

    // Add blank line after top-level blocks with children
    if (depth === 0 && lines.length > 0 && lines[lines.length - 1] !== '') {
      lines.push('');
    }
  }

  return lines;
}

/**
 * Transform a Logseq block tree into clean markdown
 * @param blocks - Array of top-level blocks from getCurrentPageBlocksTree()
 * @returns Clean markdown string
 */
export function transformBlockTree(blocks: BlockEntity[]): string {
  const allLines: string[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const isFirst = i === 0;
    const lines = processBlock(block, 0, isFirst);
    allLines.push(...lines);
  }

  // Clean up: remove consecutive blank lines, trim end
  let result = allLines.join('\n');
  result = result.replace(/\n{3,}/g, '\n\n');
  result = result.trim();

  return result;
}
