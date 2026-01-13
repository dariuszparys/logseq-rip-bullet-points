# Project: logseq-rip-bullet-points

Logseq plugin that exports pages as clean markdown by removing bullets and Logseq-specific syntax.

## Stack
- TypeScript 5.3
- Vite 5 (bundler)
- @logseq/libs 0.0.17 (Logseq plugin SDK)

## Commands
- `npm run build` — build plugin to dist/
- `npm run dev` — watch mode for development

## Structure
- `src/index.ts` — plugin entry, registers slash command and context menu
- `src/transformer.ts` — block tree to markdown conversion logic
- `src/types.ts` — re-exports BlockEntity from @logseq/libs
- `dist/` — built plugin (loaded by Logseq)

## Rules
- Use `parent.navigator.clipboard` for clipboard access (plugin runs in iframe)
- Preserve code fences and tables exactly as-is during transformation
- Top-level blocks become paragraphs; nested blocks become list items

## Domain
- **BlockEntity** — Logseq's block structure with content and children
- **Logseq syntax to clean** — `[[links]]` → plain text, `{{embeds}}` → removed, `#tags` → removed
- Plugin accessed via `/clean-markdown` slash command or page context menu

## Testing
No test suite. Manual testing:
1. Load plugin in Logseq (Developer mode → Load unpacked)
2. Create page with various block types
3. Run `/clean-markdown` and verify clipboard content
