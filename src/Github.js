require('@babel/polyfill');
const util = require('util');
const debuglog = util.debuglog('ghpr');
const octokit = require('@octokit/rest')();
const shell = require('shelljs');
const repoName = require('git-repo-name');
const username = require('git-username');

shell.config.silent = true;

class Github {
    constructor() {
        try {
            this.owner = username();
            this.repo = repoName.sync();
        } catch (e) {
            console.error('Ensure you are in a git project with an origin.');
            process.exit(1);
        }

        debuglog('Getting GitHub Token...');
        this.token = process.env.GITHUB_TOKEN || shell.exec('git config --get github.token').stdout.trim();

        if (!this.token) {
            console.error(
                'Could not retrieve GitHub Token',
                'Export the token as an environment variable GITHUB_TOKEN=<token>',
                'Or set it in your git config: git config --global github.token <token>'
            );
            return process.exit(1);
        }

        octokit.authenticate({
            type: 'oauth',
            token: this.token,
        });

        this.client = octokit;
    }

    static rootDir() {
        return shell.exec('git rev-parse --show-toplevel').stdout.trim();
    }

    async getGithubLabels() {
        const { owner, repo } = this;
        try {
            const result = await this.client.issues.listLabelsForRepo({ owner, repo });
            return result.data.map(l => l.name);
        } catch (e) {
            /* istanbul ignore next */
            debuglog(e);
            /* istanbul ignore next */
            return [];
        }
    }

    async createPullRequest({ title, base, head, body }) {
        const { owner, repo } = this;

        try {
            console.log('Creating pull request...');
            const response = await this.client.pulls.create({ owner, repo, title, base, head, body });

            console.log('Pull Request Link: ', response.data.html_url);

            this.prNumber = response.data.number;
        } catch (e) {
            console.log('There was an error creating your pull request.');
            console.log('Verify head branch is pushed to github.');
            console.log('Or run with NODE_DEBUG=ghpr to troubleshoot');
            process.exit(1);
        }
    }

    async addLabels({ number, labels }) {
        try {
            debuglog('Adding labels to Pull Request...');
            const { owner, repo } = this;
            await this.client.issues.addLabels({ owner, repo, number, labels });
        } catch (e) {
            console.log('Could not add labels to pull request');
            debuglog(e);
            process.exit(1);
        }
    }
}

module.exports = Github;
