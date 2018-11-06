#!/usr/bin/env node

const fs = require('fs');
const Promise = require('bluebird');
const shell = require('shelljs');
const util = require('util');
const convict = require('convict');
const inquirer = require('inquirer');

const debuglog = util.debuglog('ghpr');
const githublog = util.debuglog('github');
shell.config.silent = true;

const config = convict({
    githubToken: {
        doc: 'GitHub Token.',
        format: String,
        default: '',
        env: 'GITHUB_TOKEN',
    },
    templateVariables: {
        userInputs: {
            doc: 'Replace template variables with user prompted input.',
            format: Object,
            default: {},
        },
        commands: {
            doc: 'Replace template variables with output of executed commands.',
            format: Object,
            default: {},
        },
    },
});

try {
    config.loadFile(`${getRootLevel()}/.ghpr.json`);
    config.validate({ allowed: 'strict' });
} catch (e) {
    debuglog('Could not load config file.');
}

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
    head: function(base) {
        return {
            type: 'input',
            name: 'head',
            default: shell.exec('git rev-parse --abbrev-ref HEAD').stdout.trim(),
            message: 'Head Branch: ',
            validate: function(text) {
                if (base === text) {
                    return 'Base and Head branch must be different.';
                }

                return true;
            },
        };
    },
    labels: function(labels) {
        return {
            type: 'checkbox',
            message: 'Select Labels: ',
            name: 'labels',
            choices: labels,
        };
    },
};

async function main() {
    validateInGitRepo();
    const client = require('octonode').client(getAccessToken());
    const { owner, repoName } = getGithubRemoteInfo();
    debuglog('Repo owner and name are: ', owner, repoName);

    const repoLabels = await getLabels(client.repo(`${owner}/${repoName}`));

    debuglog('Prompting user for title...');
    const { title } = await inquirer.prompt(prompts.title);
    debuglog('Title: ', title);

    debuglog('Prompting user for base...');
    const { base } = await inquirer.prompt(prompts.base);
    debuglog('Base: ', base);

    debuglog('Prompting user for head...');
    const { head } = await inquirer.prompt(prompts.head(base));
    debuglog('Head: ', head);

    debuglog('Prompting user for labels...');
    const { labels } = await inquirer.prompt(prompts.labels(repoLabels));
    debuglog('Labels: ', labels);

    debuglog('Beggining render of template...');
    const body = await renderBody();
    debuglog('Pull Request Body: ', body);

    try {
        debuglog('Creating pull request...');
        const r = await client.repo(`${owner}/${repoName}`).prAsync({
            title,
            base,
            head,
            body,
        });

        const issueNumber = r[0].number;
        debuglog(`Pull Request ${issueNumber} created.`);

        if (labels.length > 0) {
            debuglog('Adding labels to Pull Request...');
            await client.issue(`${owner}/${repoName}`, issueNumber).addLabelsAsync(labels);
        }
    } catch (e) {
        if (e.body.errors[0].message.includes('A pull request already exists')) {
            console.log(`A pull request already exists for ${head} -> ${base} in ${owner}/${repoName}`);
        } else {
            console.log('Unable to create pull request.  Try running application with NODE_DEBUG=ghpr to troubleshoot');
            debuglog(JSON.stringify(e));
        }
    }
}

function validateInGitRepo() {
    debuglog('Validating in a git directory...');
    if (shell.exec('git rev-parse --is-inside-work-tree').stdout.trim() !== 'true') {
        console.error('This is not a Git project.');
        process.exit(1);
    }
}

async function getLabels(githubRepoClient) {
    debuglog('Getting labels associated with this project on GitHub...');
    try {
        const labels = await githubRepoClient.labelsAsync();
        githublog('Response from GitHub for labels: ', labels);

        const formattedLabels = labels[0].map(l => {
            return { name: l.name };
        });
        debuglog('Formatted labels are: ', formattedLabels);
        return formattedLabels;
    } catch (e) {
        debuglog("Couldn't retrieve labels.");
        console.error(e);
        return [];
    }
}

function getAccessToken() {
    debuglog('Getting GitHub Token...');
    if (process.env.GITHUB_TOKEN) {
        debuglog('GitHub token set as environment variable: ', process.env.GITHUB_TOKEN);
        return process.env.GITHUB_TOKEN;
    } else {
        const token = shell.exec('git config --get github.token').stdout.trim();
        debuglog('GitHub token retrieved from config: ', token);
        return token;
    }
}

function getRootLevel() {
    return shell.exec('git rev-parse --show-toplevel').stdout.trim();
}

async function renderBody() {
    try {
        let body = fs.readFileSync(`${getRootLevel()}/.github/pull_request_template.md`, 'utf8');

        const userInputs = config.get('templateVariables.userInputs');
        const commands = config.get('templateVariables.commands');
        return Promise.each(Object.keys(userInputs), key => {
            return inquirer
                .prompt({
                    type: 'input',
                    name: key,
                    default: userInputs[key].default || '',
                    message: userInputs[key].message,
                    validate: function(text) {
                        if (text.length < 0) {
                            return `Value cannot be empty`;
                        }
                        return true;
                    },
                })
                .then(r => {
                    body = body.replace(`{{${key}}}`, r[key]);
                });
        })
            .then(() => {
                return Promise.each(Object.keys(commands), c => {
                    body = body.replace(`{{${c}}}`, shell.exec(commands[c]).stdout.trim());
                });
            })
            .then(() => body);
    } catch (e) {
        debuglog('Could not render template: ', e);

        return await inquirer.prompt({
            type: 'input',
            name: 'body',
            message: 'Enter Pull Request Body: ',
        }).body;
    }
}

function getGithubRemoteInfo() {
    const remote = shell.exec('git remote -v').stdout.trim();
    let parsedRemote;

    if (/http/.test(remote)) {
        parsedRemote = remote.match(/.*https:\/\/github.com\/(.*)\/(.*)\.git.*/);
    } else if (/git@github/.test(remote)) {
        parsedRemote = remote.match(/.*git@github.com:(.*)\/(.*)\.git.*/);
    }

    return {
        owner: parsedRemote[1],
        repoName: parsedRemote[2],
    };
}

main();
