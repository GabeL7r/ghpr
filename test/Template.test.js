const Template = require('../src/Template.js');
const Config = require('../src/Config.js');
const Github = require('../src/Github.js');
const Prompt = require('../src/Prompt.js');
const shell = require('shelljs');

const renderedBody = 
`## Why
<!-- describe why this change is needed -->
test

## Test Coverage
test
`
const noTestCoverage = 
`## Why
<!-- describe why this change is needed -->
test

## Test Coverage

`


describe('Template', () => {
    describe('body', () => {
        it('renders user inputs and commands', () => {
            const template = new Template(Github.rootDir(), Config.get)

            template.path = 'pull_request_template.md'
            template.values = {why: 'test', testCoverage: 'test'}
            expect(template.body).toEqual(renderedBody)
        })

        it('returns empty if template doesnt exist', () => {
            const template = new Template()

            template.values = {why: 'test', testCoverage: 'test'}
            expect(template.body).toEqual('')
        })


        it('renders if missing commands', () => {
            const template = new Template(Github.rootDir(), Config.get)

            template.path = 'pull_request_template.md'
            template.values = {why: 'test', testCoverage: null}
            expect(template.body).toEqual(noTestCoverage)
        })
    })
    describe('paths', () => {
        it('returns array of template paths', () => {
            const paths = Template.paths;
            expect(paths).toEqual(expect.arrayContaining(['pull_request_template.md']))
        
        })

        it('returns empty array if none exist', () => {
            jest.mock('shelljs')
            shell.exec = jest.fn().mockReturnValue(null)
            const paths = Template.paths;
            expect(paths).toEqual([])
        })
    })

    describe('getUserInputs', () => {
        const template = new Template(Github.rootDir(), Config.get)
        jest.unmock('shelljs')
        jest.mock('../src/Prompt.js')
        Prompt.user = jest.fn().mockResolvedValue({path: 'pull_request_template.md', why: 'test'})

        it('sets the path', async () => {
            await template.getUserInputs()
            expect(template.path).toEqual('pull_request_template.md')
        })
 
        it('sets the values', async () => {
            await template.getUserInputs()
            expect(template.values).toEqual(expect.objectContaining({why: 'test'}))
        })
    
    })

    describe('runCommands', () => {
        const template = new Template(Github.rootDir(), Config.get)
        it('executes commands', () => {
            jest.mock('shelljs')
            shell.exec = jest.fn().mockReturnValue({stdout: 'test'})

            expect(template.runCommands()).toEqual({testCoverage: 'test'})
        })
 
        it('returns null for commands that arent executed', () => {
            jest.mock('shelljs')
            shell.exec = jest.fn().mockReturnValue({})

            expect(template.runCommands()).toEqual({testCoverage: null})
        })
    
    })
});
