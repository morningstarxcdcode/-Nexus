import { execSync } from 'child_process';

export function dockerStatusPlugin() {
  return {
    name: 'dockerStatusPlugin',
    getSegment: () => {
      try {
        const output = execSync('docker info --format "{{.ServerVersion}}"', { encoding: 'utf8' }).trim();
        if (output) {
          return `🐳 Docker ${output}`;
        }
        return '';
      } catch {
        return '';
      }
    },
  };
}
