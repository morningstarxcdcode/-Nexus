#!/usr/bin/env npx ts-node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inquirer_1 = __importDefault(require("inquirer"));
const simple_git_1 = __importDefault(require("simple-git"));
const chalk_1 = __importDefault(require("chalk"));
const actionPrompt_1 = __importDefault(require("./git/actionPrompt"));
const stashPrompt_1 = __importDefault(require("./git/stashPrompt"));
const git = (0, simple_git_1.default)();
function mainMenu() {
    return __awaiter(this, void 0, void 0, function* () {
        const status = yield git.status();
        console.clear();
        console.log(chalk_1.default.bold('Crazy Git UI'));
        console.log(chalk_1.default.green('Current branch:'), status.current);
        console.log(chalk_1.default.yellow('Changes:'));
        status.files.forEach(file => {
            console.log(` - ${file.path} [${file.working_dir}${file.index}]`);
        });
        console.log('\n');
        const actions = [
            { name: 'Stage all changes', key: 'a', value: 'stage_all', subActions: [
                    { name: 'Stage all', value: 'stage_all' },
                    { name: 'Unstage all', value: 'unstage_all' },
                    { name: 'Stage file', value: 'stage_file' },
                    { name: 'Unstage file', value: 'unstage_file' }
                ] },
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
        const action = yield (0, actionPrompt_1.default)({
            actions: actions
        });
        switch (action) {
            case 'stage_all': {
                yield git.add('.');
                console.log(chalk_1.default.green('All changes staged.'));
                break;
            }
            case 'commit': {
                const commitMsg = yield inquirer_1.default.prompt([
                    {
                        type: 'input',
                        name: 'message',
                        message: 'Enter commit message:'
                    }
                ]);
                yield git.commit(commitMsg.message);
                console.log(chalk_1.default.green('Changes committed.'));
                break;
            }
            case 'push': {
                try {
                    const status = yield git.status();
                    if (!status.tracking) {
                        const answer = yield inquirer_1.default.prompt([
                            {
                                type: 'confirm',
                                name: 'publish',
                                message: 'The current branch has no upstream branch. Would you like to publish it?',
                                default: true
                            }
                        ]);
                        if (answer.publish) {
                            const status = yield git.status();
                            if (status.current) {
                                yield git.push(['--set-upstream', 'origin', status.current]);
                                console.log(chalk_1.default.green(`Branch ${status.current} published`));
                            }
                            else {
                                console.log(chalk_1.default.red('No current branch found.'));
                            }
                        }
                    }
                    else {
                        yield git.push();
                        console.log(chalk_1.default.green('Pushed to remote.'));
                    }
                }
                catch (error) {
                    console.log(chalk_1.default.red(`Error: ${error}`));
                }
                break;
            }
            case 'pull': {
                yield git.pull();
                console.log(chalk_1.default.green('Pulled from remote.'));
                break;
            }
            case 'switch_branch': {
                yield switchBranch();
                break;
            }
            case 'show_log': {
                yield showCommitLog();
                break;
            }
            case 'manage_remotes': {
                yield manageRemotes();
                break;
            }
            case 'create_branch': {
                const branchName = yield inquirer_1.default.prompt([
                    {
                        type: 'input',
                        name: 'branchName',
                        message: 'Enter the new branch name:'
                    }
                ]);
                yield createBranch(branchName.branchName);
                break;
            }
            case 'delete_branch': {
                const branches = yield git.branch();
                const choices = branches.all.map(branch => ({
                    name: branch,
                    value: branch
                }));
                const answer = yield inquirer_1.default.prompt([
                    {
                        type: 'list',
                        name: 'branch',
                        message: 'Select a branch to delete',
                        choices
                    }
                ]);
                yield deleteBranch(answer.branch);
                break;
            }
            case 'graph': {
                console.log(yield git.raw(['log', '--graph', '--oneline', '--all']));
                break;
            }
            case 'stash': {
                yield (0, stashPrompt_1.default)(git);
                break;
            }
            case 'exit': {
                console.log('Goodbye!');
                process.exit(0);
            }
        }
        yield pause();
        yield mainMenu();
    });
}
function switchBranch() {
    return __awaiter(this, void 0, void 0, function* () {
        const branches = yield git.branch();
        const choices = branches.all.map(branch => ({
            name: branch,
            value: branch
        }));
        const answer = yield inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'branch',
                message: 'Select a branch to switch to',
                choices
            }
        ]);
        yield git.checkout(answer.branch);
        console.log(chalk_1.default.green(`Switched to branch ${answer.branch}`));
    });
}
function showCommitLog() {
    return __awaiter(this, void 0, void 0, function* () {
        const log = yield git.log({ maxCount: 10 });
        console.clear();
        console.log(chalk_1.default.bold('Recent Commits:'));
        log.all.forEach(commit => {
            console.log(chalk_1.default.cyan(`commit ${commit.hash}`));
            console.log(`Author: ${commit.author_name} <${commit.author_email}>`);
            console.log(`Date:   ${commit.date}`);
            console.log(`\n    ${commit.message}\n`);
        });
    });
}
function manageRemotes() {
    return __awaiter(this, void 0, void 0, function* () {
        const remotes = yield git.getRemotes(true);
        console.clear();
        console.log(chalk_1.default.bold('Git Remotes:'));
        remotes.forEach(remote => {
            console.log(`${remote.name} -> ${remote.refs.fetch}`);
        });
        const answer = yield inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'addRemote',
                message: 'Would you like to add a new remote?',
                default: false
            }
        ]);
        if (answer.addRemote) {
            const newRemote = yield inquirer_1.default.prompt([
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
            yield git.addRemote(newRemote.name, newRemote.url);
            console.log(chalk_1.default.green(`Remote ${newRemote.name} added.`));
        }
    });
}
function createBranch(name) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const status = yield git.status();
            if (status.current) {
                yield git.checkoutBranch(name, status.current);
            }
        }
        catch (error) {
            console.log(chalk_1.default.red(`Error creating branch ${name}: ${error}`));
        }
    });
}
function deleteBranch(name) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield git.deleteLocalBranch(name);
        }
        catch (error) {
            console.log(chalk_1.default.red(`Error deleting branch ${name}: ${error}`));
        }
    });
}
function pause() {
    return __awaiter(this, void 0, void 0, function* () {
        yield inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'pause',
                message: 'Press Enter to continue...'
            }
        ]);
    });
}
mainMenu();
