const util = require('util');
const debuglog = util.debuglog('ghpr');
const branch = require('git-branch');
const shell = require('shelljs');
const { prompt } = require('inquirer');

class Prompt {
    static async user(questions) {
        try {
            return await prompt(questions);
        } catch (e) {
            debuglog(e);
            console.log('Error prompting user for input');
            process.exit(1);
        }
    }

    static pullRequestQuestions(labels = []) {
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
                choices: labels,
            },
        ];

        return questions;
    }
}

module.exports = Prompt;
