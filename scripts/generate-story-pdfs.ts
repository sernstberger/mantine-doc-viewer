/**
 * Writes the sample PDFs of the customized Storybook stories to docs/public/stories/.
 * Every scripts/story-pdfs/<name>.ts except pdf-writer.ts default-exports a StoryPdfSource.
 * Run with `npx tsx scripts/generate-story-pdfs.ts`, or one: `... generate-story-pdfs.ts sheet-music`.
 */
import fs from 'node:fs';
import path from 'node:path';
import signale from 'signale';
import { StoryPdfSource, writeStoryPdf } from './story-pdfs/pdf-writer';

async function main() {
  const dir = path.join(process.cwd(), 'scripts/story-pdfs');
  const only = process.argv[2];
  const files = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.ts') && file !== 'pdf-writer.ts')
    .filter((file) => !only || file === `${only}.ts`);

  for (const file of files) {
    // A generator may default-export one source, or a list when it writes several PDFs
    const exported = (await import(path.join(dir, file))).default as
      | StoryPdfSource
      | StoryPdfSource[];
    for (const source of Array.isArray(exported) ? exported : [exported]) {
      signale.success(`Wrote ${writeStoryPdf(source)}`);
    }
  }
}

main();
