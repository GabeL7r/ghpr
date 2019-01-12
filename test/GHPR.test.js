const GHPR = require('../src/GHPR.js');
const Octokit = require('@octokit/rest');

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
});
