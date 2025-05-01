import { execSync } from 'child_process';

export function nodeVersionPlugin() {
  return {
    name: 'nodeVersionPlugin',
    getSegment: () => {
      try {
        const version = execSync('node -v', { encoding: 'utf8' }).trim();
        return `⬢ ${version}`;
      } catch {
        return '';
      }
    },
  };
}
