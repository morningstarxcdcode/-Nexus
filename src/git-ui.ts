#!/usr/bin/env npx ts-node
import inquirer from 'inquirer';
import simpleGit from 'simple-git';
import chalk from 'chalk';
import gitActions from './git/actionPrompt';
import stashPrompt from './git/stashPrompt';

const git = simpleGit();

async function mainMenu() {
  const status = await git.status();
  console.clear();
  console.log(chalk.bold('Crazy Git UI'));
  console.log(chalk.green('Current branch:'), status.current);
  console.log(chalk.yellow('Changes:'));
  status.files.forEach(file => {
    console.log(` - ${file.path} [${file.working_dir}${file.index}]`);
  });

  console.log('\n')
  const actions = [
    { name: 'Stage all changes', key: 'a', value: 'stage_all' },
    { name: 'Commit changes', key: 'c', value: 'commit' },
    { name: 'Push to remote', key: 'p', value: 'push' },
    { name: 'Pull from remote', key: 'l', value: 'pull' },
    { name: 'Switch branch', key: 's', value: 'switch_branch' },
    { name: 'Show commit log', key: 'o', value: 'show_log' },
    { name: 'Manage remotes', key: 'r', value: 'manage_remotes' },
    { name: 'Create branch', key: 'b', value: 'create_branch' },
    { name: 'Delete branch', key: 'd', value: 'delete_branch' },
    { name: 'Show graph', key: 'g', value: 'graph' },
    { name: 'Manage stashes', key: 't', value: 'stash' },
    { name: 'Exit', key: 'x', value: 'exit' }
  ];

  const action = await gitActions({
    actions: actions
  })

  switch (action) {
    case 'stage_all':
      await git.add('.');
      console.log(chalk.green('All changes staged.'));
      break;
    case 'commit':
      const commitMsg = await inquirer.prompt([
        {
          type: 'input',
          name: 'message',
          message: 'Enter commit message:'
        }
      ]);
      await git.commit(commitMsg.message);
      console.log(chalk.green('Changes committed.'));
      break;
    case 'push':
      try {
        const status = await git.status()
        if (!status.tracking) {
          const answer = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'publish',
              message: 'The current branch has no upstream branch. Would you like to publish it?',
              default: true
            }
          ])
          if (answer.publish) {
            const status = await git.status();
            if (status.current) {
              await git.push(['--set-upstream', 'origin', status.current]);
              console.log(chalk.green(`Branch ${status.current} published`))
            }
            else {
              console.log(chalk.red('No current branch found.'));
            }
          }
        }
        else {
          await git.push();
          console.log(chalk.green('Pushed to remote.'));
        }
      }
      catch (error) {
        console.log(chalk.red(`Error: ${error}`))
      }
      break;
    case 'pull':
      await git.pull();
      console.log(chalk.green('Pulled from remote.'));
      break;
    case 'switch_branch':
      await switchBranch();
      break;
    case 'show_log':
      await showCommitLog();
      break;
    case 'manage_remotes':
      await manageRemotes();
      break;
    case 'create_branch':
      const branchName = await inquirer.prompt([
        {
          type: 'input',
          name: 'branchName',
          message: 'Enter the new branch name:'
        }
      ])
      await createBranch(branchName.branchName)
      break;
    case 'delete_branch':
      const branches = await git.branch();
      const choices = branches.all.map(branch => ({
        name: branch,
        value: branch
      }));

      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'branch',
          message: 'Select a branch to delete',
          choices
        }
      ]);
      await deleteBranch(answer.branch)
      break;
    case 'graph':
      console.log(await git.raw(['log', '--graph', '--oneline', '--all']));
      break;
    case 'stash':
      await stashPrompt(git);
      break;
    case 'exit':
      console.log('Goodbye!');
      process.exit(0);
  }

  await pause();
  await mainMenu();
}

async function switchBranch() {
  const branches = await git.branch();
  const choices = branches.all.map(branch => ({
    name: branch,
    value: branch
  }));

  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'branch',
      message: 'Select a branch to switch to',
      choices
    }
  ]);

  await git.checkout(answer.branch);
  console.log(chalk.green(`Switched to branch ${answer.branch}`));
}

async function showCommitLog() {
  const log = await git.log({ maxCount: 10 });
  console.clear();
  console.log(chalk.bold('Recent Commits:'));
  log.all.forEach(commit => {
    console.log(chalk.cyan(`commit ${commit.hash}`));
    console.log(`Author: ${commit.author_name} <${commit.author_email}>`);
    console.log(`Date:   ${commit.date}`);
    console.log(`\n    ${commit.message}\n`);
  });
}

async function manageRemotes() {
  const remotes = await git.getRemotes(true);
  console.clear();
  console.log(chalk.bold('Git Remotes:'));
  remotes.forEach(remote => {
    console.log(`${remote.name} -> ${remote.refs.fetch}`);
  });

  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'addRemote',
      message: 'Would you like to add a new remote?',
      default: false
    }
  ]);

  if (answer.addRemote) {
    const newRemote = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter remote name:'
      },
      {
        type: 'input',
        name: 'url',
        message: 'Enter remote URL:'
      }
    ]);
    await git.addRemote(newRemote.name, newRemote.url);
    console.log(chalk.green(`Remote ${newRemote.name} added.`));
  }
}

async function createBranch(name: string) {
  try {
    const status = await git.status();
    if (status.current) {
      await git.checkoutBranch(name, status.current)
    }
  }
  catch (error) {
    console.log(chalk.red(`Error creating branch ${name}: ${error}`))
  }
}

async function deleteBranch(name: string) {
  try {
    await git.deleteLocalBranch(name)
  }
  catch (error) {
    console.log(chalk.red(`Error deleting branch ${name}: ${error}`))
  }
}
async function pause() {
  await inquirer.prompt([
    {
      type: 'input',
      name: 'pause',
      message: 'Press Enter to continue...'
    }
  ]);
}

mainMenu();
