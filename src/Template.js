require('@babel/polyfill');
const fs = require('fs');
const path = require('path');
const { prompt, MultiSelect, Select } = require('enquirer');
const shell = require('./Shell.js');

class Template {
    constructor(filePath, rootDir) {
        this._filePath = filePath;
        this._rootDir = rootDir;
        this._config = require(`${rootDir}/.ghpr.json`);
        this._body = fs.readFileSync(`${rootDir}/.github/pull_request_template.md`, 'utf8');
    }

    async _userInput() {
        const { userInputs } = this._config;
		
		if (!userInputs) return;

        const keys = Object.keys(userInputs);
        for (let ii = 0; ii < keys.length; ii++) {
            const question = Object.assign(userInputs[keys[ii]], { type: 'input', name: 'value' });

            const { value } = await prompt(question);

            this._body = this._body.replace(`{{${keys[ii]}}}`, value);
        }
    }

    async _commands() {
        const { commands } = this._config;

		if (!commands) return;

        const keys = Object.keys(commands);
        for (let ii = 0; ii < keys.length; ii++) {
            try {
                const value = await shell.exec(commands[keys[ii]]);
                this._body = this._body.replace(`{{${keys[ii]}}}`, value);
            } catch (e) {
                console.error(e);
            }
        }
    }
    async render() {
        await this._userInput();
        await this._commands();

        return this._body;
    }
}

module.exports = Template;
