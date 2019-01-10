#!/usr/bin/env node

require('@babel/polyfill');

const repoName = require('git-repo-name');
const username = require('git-username');
const shell = require('shelljs');
const octokit = require('@octokit/rest')();
const GHPR = require('./GHPR.js');

const util = require('util');
const debuglog = util.debuglog('ghpr');

main();

async function main() {
    const { owner, repo } = getGitInfo();
    await authGitClient();

    const ghpr = new GHPR(octokit, owner, repo);

    await ghpr.build();
    await ghpr.createPullRequest();
    await ghpr.addLabels();
}

function getGitInfo() {
    try {
        const owner = username();
        const repo = repoName.sync();
        return { owner, repo };
    } catch (e) {
        console.error('Ensure you are in a git project with an origin.');
        process.exit(1);
    }
}

async function authGitClient() {
    debuglog('Getting GitHub Token...');
    const token = process.env.GITHUB_TOKEN || (await shell.exec('git config --get github.token').stdout.trim());

    if (!token) {
        console.error(
            'Could not retrieve GitHub Token',
            'Export the token as an environment variable GITHUB_TOKEN=<token>',
            'Or set it in your git config: git config --global github.token <token>'
        );
        process.exit(1);
    }

    octokit.authenticate({
        type: 'oauth',
        token,
    });
}
