/**
 * Renders CMS-authored markdown (currently only FAQ answers) to an HTML string.
 *
 * Uses @astrojs/markdown-remark, which is already a direct dependency of Astro
 * itself — so this adds no new runtime dependency to the project. It is also
 * the exact processor Astro uses for .md files, which keeps CMS-authored
 * markdown rendering consistent with the rest of the site.
 */
import { createMarkdownProcessor } from '@astrojs/markdown-remark';

let processorPromise: ReturnType<typeof createMarkdownProcessor> | undefined;

function getProcessor() {
  processorPromise ??= createMarkdownProcessor({});
  return processorPromise;
}

export async function renderMarkdown(source: string): Promise<string> {
  const processor = await getProcessor();
  const { code } = await processor.render(source);
  return code;
}
