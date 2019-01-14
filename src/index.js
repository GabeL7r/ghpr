#!/usr/bin/env node

require('@babel/polyfill');

const Github = require('./Github.js');
const Config = require('./Config.js');
const Prompt = require('./Prompt.js');
const Template = require('./Template.js');

const util = require('util');
const debuglog = util.debuglog('ghpr');

main();

async function main() {
    const github = new Github();

    const labels = await github.getGithubLabels();

    const {title, base, head, selectedLabels } = await Prompt.user(Prompt.pullRequestQuestions(labels))

    const template = new Template(Github.rootDir(), Config.get)
    await template.getUserInputs();
    template.runCommands();

    const body = template.body;

    await github.createPullRequest({title, base, head, body, labels: selectedLabels});
}
