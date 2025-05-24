export default function useTerminalSize() {
  return { width: process.stdout.columns, height: process.stdout.rows };
}