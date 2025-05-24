import { SimpleGit } from "simple-git";
import gitActions from "./actionPrompt";
import inquirer from "inquirer";
import chalk from "chalk";

async function selectStash(git: SimpleGit, message?: string): Promise<{ index: number; message: string; hash: string }> {
  const stashes = await git.stashList();
  if (stashes.all.length === 0) {
    console.log(chalk.red('No stashes found.'));
    return { index: -1, message: '', hash: '' };
  }

  const choices = stashes.all.map((stash: any, index: number) => ({
    name: `${index}: ${stash.message} (${stash.hash})`,
    value: { index, message: stash.message, hash: stash.hash }
  }));

  const { selectedStash } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedStash',
      message: message ?? 'Select a stash:',
      choices
    }
  ]);

  return selectedStash;
}
export default async function stashPrompt(git: SimpleGit) {
  console.clear();
  console.log(chalk.cyan('Stash Menu'));
  const action = await gitActions({
    actions: [
      { value: 'save', name: 'Save Stash' },
      { value: 'list', name: 'List Stashes' },
      { value: 'apply', name: 'Apply Stash' },
      { value: 'drop', name: 'Drop Stash' },
      { value: 'pop', name: 'Pop Stash' },
      { value: 'clear', name: 'Clear Stashes' },
      { value: 'branch', name: 'Create Branch from Stash' },
      { value: 'show', name: 'Show Stash' },
      { value: 'back', name: 'Back' }
    ],
    keys: 'number'
  })

  switch (action) {
    case 'save':
      const { stashMessage } = await inquirer.prompt([
        {
          type: 'input',
          name: 'stashMessage',
          message: 'Enter stash message (optional):'
        }
      ])

      if (stashMessage) {
        await git.stash(['save', stashMessage]);
        console.log(`Stash saved with message: ${stashMessage}`);
      } else {
        await git.stash(['save']);
      }
      console.log(chalk.green('Stash saved.'));
      break;
    case 'list':
      const stashes = await git.stashList();
      if (stashes.all.length === 0) {
        console.log('No stashes found.');
      }
      else {
        console.log('Stashes:');
        stashes.all.forEach((stash, index) => {
          console.log(`${index}: ${stash.message}`);
        });
      }
      break;
    case 'apply':
      const applyStash = await selectStash(git, 'Select a stash to apply:');

      await git.stash(['apply', `stash@{${applyStash.index}}`]);
      console.log(chalk.green(`Stash applied: stash@{${applyStash.index}} (${applyStash.hash})`));
      break;
    case 'drop':
      const { index, message, hash } = await selectStash(git, 'Select a stash to drop:');
      if (index === -1) {
        break;
      }
      await git.stash(['drop', `stash@{${index}}`]);
      console.log(chalk.green(`Stash dropped: stash@{${index}} (${hash})` + message ? `: ${message}` : ''));

      break;
    case 'pop':
      const popStash = await selectStash(git, 'Select a stash to pop:');
      // Get the stash list before popping to retrieve the hash
      await git.stash(['pop', `stash@{${popStash.index}}`]);
        console.log(chalk.green(`Stash popped: stash@{${popStash.index}} (${popStash.hash})`));
      break;
    case 'clear':
      await git.stash(['clear']);
      console.log(chalk.green('All stashes cleared.'));
      break;
    case 'branch':
      const branchStash = await selectStash(git, 'Select a stash to create a branch from:');
      const { branchName } = await inquirer.prompt([
        {
          type: 'input',
          name: 'branchName',
          message: 'Enter the new branch name:'
        }
      ]);

      await git.stash(['branch', branchName, `stash@{${branchStash.index}}`]);
      console.log(chalk.green(`Branch created from stash: ${branchName}`));
      break;
    case 'show':
      const showStash = await selectStash(git, 'Select a stash to show:');
      const stashShow = await git.stash(['show', `stash@{${showStash.index}}`]);
      if (stashShow) {
        console.log(chalk.green(`Stash show: stash@{${showStash.index}}`));
        console.log(stashShow);
      } else {
        console.log(chalk.red(`No stash found at index: ${showStash.index}`));
      }
      break;
    case 'back':
      console.log('Going back...');
      return;
  }
}