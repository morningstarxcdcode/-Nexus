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
exports.default = stashPrompt;
const actionPrompt_1 = __importDefault(require("./actionPrompt"));
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
function selectStash(git, message) {
    return __awaiter(this, void 0, void 0, function* () {
        const stashes = yield git.stashList();
        if (stashes.all.length === 0) {
            console.log(chalk_1.default.red('No stashes found.'));
            return { index: -1, message: '', hash: '' };
        }
        const choices = stashes.all.map((stash, index) => ({
            name: `${index}: ${stash.message} (${stash.hash})`,
            value: { index, message: stash.message, hash: stash.hash }
        }));
        const { selectedStash } = yield inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'selectedStash',
                message: message !== null && message !== void 0 ? message : 'Select a stash:',
                choices
            }
        ]);
        return selectedStash;
    });
}
function stashPrompt(git) {
    return __awaiter(this, void 0, void 0, function* () {
        console.clear();
        console.log(chalk_1.default.cyan('Stash Menu'));
        const action = yield (0, actionPrompt_1.default)({
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
        });
        switch (action) {
            case 'save': {
                const { stashMessage } = yield inquirer_1.default.prompt([
                    {
                        type: 'input',
                        name: 'stashMessage',
                        message: 'Enter stash message (optional):'
                    }
                ]);
                if (stashMessage) {
                    yield git.stash(['save', stashMessage]);
                    console.log(`Stash saved with message: ${stashMessage}`);
                }
                else {
                    yield git.stash(['save']);
                }
                console.log(chalk_1.default.green('Stash saved.'));
                break;
            }
            case 'list': {
                const stashes = yield git.stashList();
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
            }
            case 'apply': {
                const applyStash = yield selectStash(git, 'Select a stash to apply:');
                yield git.stash(['apply', `stash@{${applyStash.index}}`]);
                console.log(chalk_1.default.green(`Stash applied: stash@{${applyStash.index}} (${applyStash.hash})`));
                break;
            }
            case 'drop': {
                const { index, message, hash } = yield selectStash(git, 'Select a stash to drop:');
                if (index === -1) {
                    break;
                }
                yield git.stash(['drop', `stash@{${index}}`]);
                console.log(chalk_1.default.green(`Stash dropped: stash@{${index}} (${hash})` + (message ? `: ${message}` : '')));
                break;
            }
            case 'pop': {
                const popStash = yield selectStash(git, 'Select a stash to pop:');
                yield git.stash(['pop', `stash@{${popStash.index}}`]);
                console.log(chalk_1.default.green(`Stash popped: stash@{${popStash.index}} (${popStash.hash})`));
                break;
            }
            case 'clear': {
                yield git.stash(['clear']);
                console.log(chalk_1.default.green('All stashes cleared.'));
                break;
            }
            case 'branch': {
                const branchStash = yield selectStash(git, 'Select a stash to create a branch from:');
                const { branchName } = yield inquirer_1.default.prompt([
                    {
                        type: 'input',
                        name: 'branchName',
                        message: 'Enter the new branch name:'
                    }
                ]);
                yield git.stash(['branch', branchName, `stash@{${branchStash.index}}`]);
                console.log(chalk_1.default.green(`Branch created from stash: ${branchName}`));
                break;
            }
            case 'show': {
                const showStash = yield selectStash(git, 'Select a stash to show:');
                const stashShow = yield git.stash(['show', `stash@{${showStash.index}}`]);
                if (stashShow) {
                    console.log(chalk_1.default.green(`Stash show: stash@{${showStash.index}}`));
                    console.log(stashShow);
                }
                else {
                    console.log(chalk_1.default.red(`No stash found at index: ${showStash.index}`));
                }
                break;
            }
            case 'back': {
                console.log('Going back...');
                return;
            }
        }
    });
}
