#!/usr/bin/env node

const fs = require('fs');
const shell = require('./Shell.js');
const util = require('util');
const Github = require('./Github.js');
const Template = require('./Template.js');
const { prompt, MultiSelect, Select } = require('enquirer');

const debuglog = util.debuglog('ghpr');

async function main() {
    await validateInGitRepo();
    const githubClient = await createGithubClient();

    const labels = await githubClient.getLabels();

    const prompts = {
        title: {
            type: 'input',
            name: 'title',
            message: 'Pull Request Title: ',
            validate: function(text) {
                if (text.length < 0) {
                    return 'Must include a title.';
                }
                return true;
            },
        },
        base: {
            type: 'input',
            name: 'base',
            default: 'master',
            message: 'Base Branch: ',
        },
        head: async function(base) {
            return {
                type: 'input',
                name: 'head',
                default: await shell.exec('git rev-parse --abbrev-ref HEAD'),
                message: 'Head Branch: ',
                validate: function(text) {
                    if (base === text) {
                        return 'Base and Head branch must be different.';
                    }

                    return true;
                },
            };
        },
    };

    debuglog('Prompting user for title...');
    const { title } = await prompt(prompts.title);
    debuglog('Title: ', title);

    debuglog('Prompting user for base...');
    const { base } = await prompt(prompts.base);
    debuglog('Base: ', base);

    debuglog('Prompting user for head...');
    const { head } = await prompt(await prompts.head(base));
    debuglog('Head: ', head);

    debuglog('Prompting user for labels...');
    const selectedLabels = await new MultiSelect({
        message: 'Select Labels: ',
        name: 'selectedLabels',
        choices: labels,
    }).run();
    debuglog('Selected Labels: ', selectedLabels);

    debuglog('Prompting user template...');
    const templates = await shell.exec('ls $(git rev-parse --show-toplevel)/.github');
    const { templatePath } = await new Select({
        message: 'Select Template: ',
        name: 'template',
        choices: templates.split('\n'),
    }).run();
    debuglog('Template: ', templatePath);

    const rootDir = await shell.exec('git rev-parse --show-toplevel');
    const template = new Template(templatePath, rootDir);

    const body = await template.render();

    const prNumber = await githubClient.createPr({ title, base, head, body });
    if (selectedLabels.length > 0) {
        console.log(prNumber);
        debuglog('Adding labels to Pull Request...');
        await githubClient.addLabel(prNumber, selectedLabels);
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

main();
