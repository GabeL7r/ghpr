#!/usr/bin/env node

const fs = require('fs');
const shell = require('./src/Shell.js');
const util = require('util');
const Github = require('./src/Github.js');

const debuglog = util.debuglog('ghpr');

async function main() {
    await validateInGitRepo();
    const githubClient = await createGithubClient();

    const repoLabels = await githubClient.getLabels();

    /*
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
    */
}

async function createGithubClient() {
    const token = await getAccessToken();
    const { owner, repo } = await getGithubRemoteInfo();

    return new Github(token, owner, repo)
}

async function validateInGitRepo() {
    debuglog('Validating in a git directory...');
    try {
        await shell.exec('git rev-parse --is-inside-work-tree') 
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
        console.error('Could not retrieve GitHub Token',
                      'Export the token as an environment variable GITHUB_TOKEN=<token>',
                      'Or set it in your git config: git config --global github.token <token>')
        process.exit(1)
    }

    return result
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
