import '@logseq/libs';
import { transformBlockTree } from './transformer';

async function copyCleanMarkdown() {
  try {
    // Get current page blocks tree
    const blocks = await logseq.Editor.getCurrentPageBlocksTree();

    if (!blocks || blocks.length === 0) {
      logseq.UI.showMsg('No content found on this page', 'warning');
      return;
    }

    // Transform to clean markdown
    const markdown = transformBlockTree(blocks);

    if (!markdown) {
      logseq.UI.showMsg('No content to copy', 'warning');
      return;
    }

    // Copy to clipboard using parent navigator (workaround for plugin context)
    await parent.navigator.clipboard.writeText(markdown);

    logseq.UI.showMsg('Copied clean markdown to clipboard!', 'success');
  } catch (error) {
    console.error('Failed to copy clean markdown:', error);
    logseq.UI.showMsg('Failed to copy: ' + (error as Error).message, 'error');
  }
}

async function main() {
  // Register slash command
  logseq.Editor.registerSlashCommand('clean-markdown', async () => {
    await copyCleanMarkdown();
  });

  // Register page context menu item
  logseq.App.registerPageMenuItem('Copy as Clean Markdown', async () => {
    await copyCleanMarkdown();
  });

  console.log('Rip Bullet Points plugin loaded');
}

logseq.ready(main).catch(console.error);
