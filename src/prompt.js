import chalk from 'chalk';
import { execSync } from 'child_process';
import { examplePlugin } from './plugins/examplePlugin.js';
import { timePlugin } from './plugins/timePlugin.js';
import { nodeVersionPlugin } from './plugins/nodeVersionPlugin.js';
import { pythonVersionPlugin } from './plugins/pythonVersionPlugin.js';
import { dockerStatusPlugin } from './plugins/dockerStatusPlugin.js';

function getGitBranch() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    return branch ? chalk.green(` ${branch}`) : '';
  } catch {
    return '';
  }
}

function getCrazyIndicator() {
  const emojis = ['🤪', '🦄', '🚀', '🔥', '💥'];
  return emojis[Math.floor(Math.random() * emojis.length)];
}

function renderPrompt() {
  const user = chalk.yellow(process.env.USER || 'user');
  const cwd = chalk.cyan(process.cwd());
  const gitBranch = getGitBranch();
  const crazy = getCrazyIndicator();

  // Load plugins and get their segments
  const plugins = [examplePlugin(), timePlugin(), nodeVersionPlugin(), pythonVersionPlugin(), dockerStatusPlugin()];
  const pluginSegments = plugins.map(p => p.getSegment()).filter(Boolean).join(' | ');

  let prompt = `${user} ${cwd}`;
  if (gitBranch) {
    prompt += ` ${gitBranch}`;
  }
  prompt += ` ${crazy}`;
  if (pluginSegments) {
    prompt += ` | ${pluginSegments}`;
  }
  prompt += `\n$ `;
  return prompt;
}

console.log(renderPrompt());
