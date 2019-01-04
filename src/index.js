#!/usr/bin/env node

require('@babel/polyfill');
const shell = require('./Shell.js');
const util = require('util');
const Github = require('./Github.js');
const Template = require('./Template.js');
const { prompt, MultiSelect, Select } = require('enquirer');

const debuglog = util.debuglog('ghpr');

main();

async function main() {
    await validateInGitRepo();
    const githubClient = await createGithubClient();

    const ghpr = new GHPR(githubClient);

    await ghpr.build();
    await ghpr.create();
    await ghpr.addLabels();
}

class GHPR {
    constructor(githubClient) {
        this._githubClient = githubClient;
    }

    async build() {
        await this._getTitle();
        await this._getBase();
        await this._getHead();
        await this._getLabels();
        await this._getTemplatePath();
        this._rootDir = await shell.exec('git rev-parse --show-toplevel');
        this._template = new Template(this._templatePath, this._rootDir);
        await this._getBody();
    }

    async create() {
        const { _title: title, _base: base, _head: head, _body: body } = this;

        this._prNumber = await this._githubClient.createPr({ title, base, head, body });
    }

    async addLabels() {
        if (this._selectedLabels.length > 0) {
            debuglog('Adding labels to Pull Request...');
            await this._githubClient.addLabel(this._prNumber, this._selectedLabels);
        }
    }

    async _getBase() {
        const { base } = await prompt({
            type: 'input',
            name: 'base',
            default: 'master',
            message: 'Base Branch: ',
        });
        debuglog('Base: ', base);

        return (this._base = base);
    }

    async _getHead() {
        const { head } = await prompt(async function() {
            return {
                type: 'input',
                name: 'head',
                default: await shell.exec('git rev-parse --abbrev-ref HEAD'),
                message: 'Head Branch: ',
                validate: function(text) {
                    if (this._base === text) {
                        return 'Base and Head branch must be different.';
                    }

                    return true;
                },
            };
        });
        debuglog('Head: ', head);

        return (this._head = head);
    }

    async _getTemplatePath() {
        const templates = await shell.exec('ls $(git rev-parse --show-toplevel)/.github');
        const templatePath = await new Select({
            message: 'Select Template: ',
            name: 'template',
            choices: templates.split('\n'),
        }).run();
        debuglog('Template: ', templatePath);

        return (this._templatePath = templatePath);
    }

    async _getLabels() {
        const labels = await this._githubClient.getLabels();
        const selectedLabels = await new MultiSelect({
            message: 'Select Labels: ',
            name: 'selectedLabels',
            choices: labels,
        }).run();
        debuglog('Selected Labels: ', selectedLabels);

        this._selectedLabels = selectedLabels;
    }

    async _getTitle() {
        const { title } = await prompt({
            type: 'input',
            name: 'title',
            message: 'Pull Request Title: ',
            validate: function(text) {
                if (text.length < 0) {
                    return 'Must include a title.';
                }
                return true;
            },
        });
        debuglog('Title: ', title);

        this._title = title;
    }

    async _getBody() {
        return await this._template.render();
    }
}

async function createGithubClient() {
    const token = await getAccessToken();
    const { owner, repo } = await getGithubRemoteInfo();

    return new Github(token, owner, repo);
}

async function validateInGitRepo() {
    debuglog('Validating in a git directory...');
    try {
        await shell.exec('git rev-parse --is-inside-work-tree');
    } catch (e) {
        console.error('This is not a Git project.');
        process.exit(1);
    }
}

async function getAccessToken() {
    let result;
    debuglog('Getting GitHub Token...');
    const token = await shell.exec('git config --get github.token');
    result = process.env.GITHUB_TOKEN || token;

    if (!result) {
        console.error(
            'Could not retrieve GitHub Token',
            'Export the token as an environment variable GITHUB_TOKEN=<token>',
            'Or set it in your git config: git config --global github.token <token>'
        );
        process.exit(1);
    }

    return result;
}

async function getGithubRemoteInfo() {
    const remote = await shell.exec('git remote -v');
    let parsedRemote;

    if (/http/.test(remote)) {
        parsedRemote = remote.match(/.*https:\/\/github.com\/(.*)\/(.*)\.git.*/);
    } else if (/git@github/.test(remote)) {
        parsedRemote = remote.match(/.*git@github.com:(.*)\/(.*)\.git.*/);
    }

    debuglog('Repo owner and name are: ', parsedRemote[1], parsedRemote[2]);
    return {
        owner: parsedRemote[1],
        repo: parsedRemote[2],
    };
}
