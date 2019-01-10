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
        this._githubClient = githubClient;
        this.owner = owner;
        this.repo = repo;
        try {
            this.config = require(`${this.rootDir}/.ghpr.json`)
        } catch(e) {
            this.config = {}
        }
    }

    async build() {
        await this._getGithubLabels();
        await this._promptUserForInfo();
        await this._createBody();
    }

    async create() {
        const { title, base, head, body, owner, repo } = this;

        const response = await this._githubClient.pulls.create({ owner, repo, title, base, head, body });

        console.log(response)
    }

    async addLabels() {
        if (this.answers.selectedLabels.length > 0) {
            debuglog('Adding labels to Pull Request...');
            await this._githubClient.addLabel(this.prNumber, this.selectedLabels);
        }
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
        ]

        try {
            const templates = shell.exec('ls $(git rev-parse --show-toplevel)/.github').stdout.trim()
            questions.push({
                    type: 'list',
                    message: 'Select Template: ',
                    name: 'templatePath',
                    choices: templates.split('\n'),
            })

            if(this.config.userInputs) {
                Object.keys(this.config.userInputs).forEach( k => {
                    questions.push(Object.assign({type: 'input', name: k}, this.config.userInputs[k]))
                })
            }
        } catch(e) {
            questions.push({
                type: 'input',
                name: 'body',
                message: 'Pull Request Body: ',
            }) 
        }

        return questions
    }
   
    async _promptUserForInfo() {
        this.answers = await prompt(this.createQuestionList());
    }

    async _getGithubLabels() {
        const { owner, repo } = this;
        const result = await this._githubClient.issues.listLabelsForRepo({owner, repo});
        this.labels = result.data.map(l => l.name)
    }

    async _createBody() {
        try {
            const templateBody = fs.readFileSync(`${this.rootDir}/.github/${this.answers.templatePath}`, 'utf8');
            this.body = mustache.render(templateBody, this.createViewForTemplateRender())
        } catch(e) {
            debuglog(e)
        }
    }

    createViewForTemplateRender() {
        const result = {}
        Object.keys(this.config.userInputs).forEach(k => {
            result[k] = this.answers[k]
        })

        try {
            Object.keys(this.config.commands).forEach(k => {
                result[k] = () => {
                    const result = shell.exec(this.config.commands[k])

                    return (result.stdout || result.stderr).trim()
                }
            })
        } catch(e) {
            debuglog(e)
        }

        return result;
    }
}


module.exports = GHPR;
