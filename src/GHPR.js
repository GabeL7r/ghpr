const util = require('util');
const debuglog = util.debuglog('ghpr');
const branch = require('git-branch');
const shell = require('shelljs');
const mustache = require('mustache');
const { prompt } = require('inquirer');
const fs = require('fs');
shell.config.silent = process.env.NODE_DEBUG === 'ghpr';

class GHPR {
    constructor(githubClient, owner, repo) {
        this.rootDir = shell.exec('git rev-parse --show-toplevel').stdout.trim();
        this.githubClient = githubClient;
        this.owner = owner;
        this.repo = repo;
        try {
            this.config = require(`${this.rootDir}/.ghpr.json`);
        } catch (e) {
            this.config = {};
        }
    }

    async build() {
        await this.getGithubLabels();
        await this.promptUserForInfo();
        await this.createBody();
    }

    async getGithubLabels() {
        const { owner, repo } = this;
        const result = await this.githubClient.issues.listLabelsForRepo({ owner, repo });
        this.labels = result.data.map(l => l.name);
    }

    async promptUserForInfo() {
        this.answers = await prompt(this.createQuestionList());
    }

    createQuestionList() {
        const questions = [
            {
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
            {
                type: 'input',
                name: 'base',
                default: 'master',
                message: 'Base Branch: ',
            },
            {
                type: 'input',
                name: 'head',
                default: branch.sync(),
                message: 'Head Branch: ',
                validate: function(text, answers) {
                    if (answers.base === text) {
                        return 'Base and Head branch must be different.';
                    }

                    return true;
                },
            },
            {
                type: 'checkbox',
                message: 'Select Labels: ',
                name: 'selectedLabels',
                choices: this.labels,
            },
        ];

        try {
            const templates = shell.exec('ls $(git rev-parse --show-toplevel)/.github').stdout.trim();
            questions.push({
                type: 'list',
                message: 'Select Template: ',
                name: 'templatePath',
                choices: templates.split('\n'),
            });

            if (this.config.userInputs) {
                Object.keys(this.config.userInputs).forEach(k => {
                    questions.push(Object.assign({ type: 'input', name: k }, this.config.userInputs[k]));
                });
            }
        } catch (e) {
            questions.push({
                type: 'input',
                name: 'body',
                message: 'Pull Request Body: ',
            });
        }

        return questions;
    }
    async createBody() {
        try {
            const templateBody = fs.readFileSync(`${this.rootDir}/.github/${this.answers.templatePath}`, 'utf8');
            this.body = mustache.render(templateBody, this.createViewForTemplateRender());
        } catch (e) {
            debuglog(e);
        }
    }

    createViewForTemplateRender() {
        const result = {};
        Object.keys(this.config.userInputs).forEach(k => {
            result[k] = this.answers[k];
        });

        try {
            Object.keys(this.config.commands).forEach(k => {
                result[k] = () => {
                    console.log('Running command: ', this.config.commands[k]);
                    const result = shell.exec(this.config.commands[k]);

                    return (result.stdout || result.stderr).trim();
                };
            });
        } catch (e) {
            debuglog(e);
        }

        return result;
    }

    async createPullRequest() {
        const { title, base, head } = this.answers;
        const { body, owner, repo } = this;

        try {
            console.log('Creating pull request...');
            const response = await this.githubClient.pulls.create({ owner, repo, title, base, head, body });

            console.log('Pull Request Link: ', response.data.url);

            this.prNumber = response.data.number;
        } catch (e) {
            console.log('There was an error creating your pull request.');
            console.log('Verify head branch is pushed to github.');
            console.log('Or run with NODE_DEBUG=ghpr to troubleshoot');
            process.exit(1);
        }
    }

    async addLabels() {
        if (this.answers.selectedLabels.length > 0) {
            debuglog('Adding labels to Pull Request...');
            const { body, owner, repo, prNumber: number } = this;
            const { selectedLabels: labels } = this.answers;
            await this.githubClient.issues.addLabels({ owner, repo, number, labels });
        }
    }
}

module.exports = GHPR;
