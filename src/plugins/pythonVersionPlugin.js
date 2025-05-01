import { execSync } from 'child_process';

export function pythonVersionPlugin() {
  return {
    name: 'pythonVersionPlugin',
    getSegment: () => {
      try {
        const version = execSync('python3 --version', { encoding: 'utf8' }).trim();
        return `🐍 ${version}`;
      } catch {
        return '';
      }
    },
  };
}
