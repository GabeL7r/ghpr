require('@babel/polyfill');
const util = require('util');
const debuglog = util.debuglog('ghpr');
const Github = require('./Github.js');
const Prompt = require('./Prompt.js');
const fs = require('fs');
const ejs = require('ejs');
const shell = require('shelljs');

class Template {
    constructor(rootDir, config) {
        this.config = config;
        this.rootDir = rootDir;
    }

    static get paths() {
        try {
            const result = shell.exec('ls $(git rev-parse --show-toplevel)/.github').stdout.trim().split('\n')
            return result
        } catch(e) {
            return []
        }
    }

    get body() {
        try {
            const templateBody = fs.readFileSync(`${this.rootDir}/.github/${this.path}`, 'utf8');
            return ejs.render(templateBody, this.values);
        } catch (e) {
            debuglog(e);
            return '';
        }
    }

    async getUserInputs() {
        const choices = Template.paths
        const { path }  = await Prompt.user({
                type: 'list',
                message: 'Select Template: ',
                name: 'path',
                choices
            })

        this.path = path;

        const questions = [];
        if (Template.paths.length && this.config.userInputs) {
            questions.push();

            Object.keys(this.config.userInputs).forEach(k => {
                questions.push(Object.assign({ type: 'input', name: k }, this.config.userInputs[k]));
            });
        } else {
            questions.push({
                type: 'input',
                name: 'body',
                message: 'Pull Request Body: ',
            });
        }

        this.values = Object.assign({}, this.values, await Prompt.user(questions))

        return this.values;
    }

    runCommands() {
        let result = {}
        Object.keys(this.config.commands).forEach(k => {
            try {
                const output = shell.exec(this.config.commands[k]);
                result[k] = (output.stdout || output.stderr).trim();
            } catch (e) {
                debuglog(e);
                console.log('Could not execute command: ', this.config.commands[k])
                result[k] = null
            }
        });

        this.values = Object.assign({}, this.values, result)

        return this.values
    }
}

module.exports = Template
