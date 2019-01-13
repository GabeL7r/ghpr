const Github = require('../src/Github.js');
const Config = require('../src/Config.js');
const testConfig = require('../.ghpr.json');
let repoName = require('git-repo-name');
const shell = require('shelljs');
const Octokit = require('@octokit/rest');

jest.mock('@octokit/rest');

describe('Github', () => {

    describe('constructor', () => {
        it('sets repo owner and name', () => {
            const github = new Github();
            expect(github.owner).toEqual('CodeSherpas')
            expect(github.repo).toEqual('ghpr')
            expect(github.token).not.toBe('')
            expect(github.octokit).not.toBe('')
        })

        it('exits program if not in github repo', () => {
            jest.mock('git-repo-name')
            const realProcess = process;
            const exitMock = jest.fn();
            global.process = { ...realProcess, exit: exitMock };
            const backup = repoName.sync;
            repoName.sync = jest.fn().mockImplementation( () => {throw new Error()})

            const github = new Github();

            expect(exitMock).toHaveBeenCalledWith(1)
            global.process = {...realProcess}
            repoName.sync = backup;
        })
 
        it('exits program if no github token found', () => {
            delete process.env.GITHUB_TOKEN;

            jest.mock('shelljs')
            const realProcess = process;
            const exitMock = jest.fn();
            global.process = { ...realProcess, exit: exitMock };
            const backup = shell.exec
            shell.exec = jest.fn().mockReturnValue({stdout: ''})

            const github = new Github();
            expect(exitMock).toHaveBeenCalledWith(1)

            global.process = {...realProcess}
            shell.exec = backup
        })
 
    })
    describe('getGithubLabels', () => {
        let octokit;
        afterEach( () => {
            jest.resetModules();
        })

        beforeEach( () => {
            octokit = new Octokit();
            octokit.issues = {};
        })


        it('sets labels when successful', async () => {
            const github = new Github();
            await github.getGithubLabels();

            expect(github.labels).toEqual(expect.arrayContaining(['bug', 'wip']))

        })

        it('sets labels to empty array when call cannot be made', async () => {
            octokit
                .issues
                .listLabelsForRepo = jest.fn()
                .mockResolvedValue(new Error('Could not fetch labels'))
            
            const github = new Github();
            await github.getGithubLabels();
            expect(github.labels).toEqual(expect.arrayContaining([]))
            
            octokit
                .issues
                .listLabelsForRepo
                .mockReset()
        })
    
    })
 
    describe('createPullRequest', () => {

        it('creates pull request', async () => {
            const github = new Github();
            await github.createPullRequest({title: 'test', base: 'master', head: 'test', body: 'test'});
            expect(github.prNumber).toEqual(42)
        })

        it('exits if pull request could not be made', async () => {
            const realProcess = process;
            const exitMock = jest.fn();
            global.process = { ...realProcess, exit: exitMock };

            const github = new Github();
            await github.createPullRequest({title: 'test', base: null, head: 'test', body: 'test'});

            expect(exitMock).toHaveBeenCalledWith(1)
            global.process = {...realProcess}
        })


    })



});


