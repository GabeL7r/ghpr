const Prompt = require('../src/Prompt.js');
const Octokit = require('@octokit/rest');
const inquirer = require('inquirer');

jest.mock('inquirer');
jest.mock('@octokit/rest');

describe('Prompt', () => {
    describe('user', () => {
        it('sets answers correctly', async () => {
            const answers = {title: 'test title', base: 'master', head: 'test', labels: [] }
            inquirer.prompt.mockResolvedValue(answers);
        
            expect(await Prompt.user()).toEqual(answers)
        })

        it('exits program if there is an error with prompt', async () => {
            const realProcess = process;
            const exitMock = jest.fn();
            global.process = { ...realProcess, exit: exitMock };

            inquirer.prompt.mockRejectedValue(new Error('Something went wrong'));

            await Prompt.user();
            expect(exitMock).toHaveBeenCalledWith(1)
        
        })
    
    })

    describe('pullRequestQuestions', () => {
        it('creates questionlist for pull request', () => {
            expect(Prompt.pullRequestQuestions(['bug', 'wip'])).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        name: 'selectedLabels',
                        choices: expect.arrayContaining(['bug', 'wip'])
                    }),
                ]))
        })
    })
});
