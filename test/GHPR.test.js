const GHPR = require('../src/GHPR.js');
const Octokit = require('@octokit/rest');
const inquirer = require('inquirer');

jest.mock('inquirer');
jest.mock('@octokit/rest');
const octokit = new Octokit();
octokit.issues = {}

const ghpr = new GHPR(octokit, 'CodeSherpas', 'test')

describe('GHPR', () => {
    describe('constructor', () => {
        it('gets constructed properly', () => {
            expect(typeof ghpr.build).toBe('function')
            expect(typeof ghpr.getGithubLabels).toBe('function')
        })
    })

    describe('getGithubLabels', () => {
        it('sets labels when successful', async () => {
            octokit.issues.listLabelsForRepo = jest
                .fn()
                .mockResolvedValue({data: [{name: 'bug'}, {name: 'wip'}]})
            await ghpr.getGithubLabels();
            expect(ghpr.labels).toEqual(expect.arrayContaining(['bug', 'wip']))
        })

        it('sets labels to empty array when call cannot be made', async () => {
            octokit.issues.listLabelsForRepo = jest
                .fn()
                .mockResolvedValue(new Error('Could not fetch labels'))
            
            await ghpr.getGithubLabels();
            expect(ghpr.labels).toEqual(expect.arrayContaining([]))
        })
    
    })

    describe('promptUserForInfo', () => {
        it('sets answers correctly', async () => {
            const answers = {title: 'test title', base: 'master', head: 'test', labels: [] }
            inquirer.prompt.mockResolvedValue(answers);
        
            await ghpr.promptUserForInfo()

            expect(ghpr.answers).toEqual(answers)
        })

        it('exits program if there is an error with prompt', async () => {
            const realProcess = process;
            const exitMock = jest.fn();
            global.process = { ...realProcess, exit: exitMock };

            inquirer.prompt.mockRejectedValue(new Error('Something went wrong'));

            await ghpr.promptUserForInfo();
            expect(exitMock).toHaveBeenCalledWith(1)
        
        })
    
    })
});
