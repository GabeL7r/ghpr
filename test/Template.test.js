const shell = require('../src/Shell.js');
const inquirer = require('inquirer');

const Template = require('../src/Template.js');


const config = require('../.ghpr.json');
const templateBody = `
## Why
<!-- describe why this change is needed -->
{{why}}

## Test Coverage
{{testCoverage}}

## Complexity
{{complexity}}
`

const renderedTemplate = 
`
## Why
<!-- describe why this change is needed -->
prompt

## Test Coverage
command

## Complexity
command
`
const inputPartialRenderedTemplate = 
`
## Why
<!-- describe why this change is needed -->
prompt

## Test Coverage
{{testCoverage}}

## Complexity
{{complexity}}
`

const commandPartialRenderedTemplate = 
`
## Why
<!-- describe why this change is needed -->
{{why}}

## Test Coverage
command

## Complexity
command
`


jest.mock('inquirer');
jest.mock('../src/Shell.js');
const template = new Template(templateBody, config);

describe('Template', () => {

    test('is instatiated correctly', () => {
		const template = new Template(templateBody, config);
        expect(typeof template).toBe('object');
    });


	test('renders template correctly', async () => {
		const template = new Template(templateBody, config);
		inquirer.prompt.mockResolvedValue({value: 'prompt'});
		shell.exec.mockResolvedValue('command');

		expect(await template.render()).toBe(renderedTemplate)
	});

	test('renders partial template if commands fail', async () => {
		const template = new Template(templateBody, config);
		inquirer.prompt.mockResolvedValue({value: 'prompt'});
		shell.exec.mockImplementation(() => {
			throw new Error();
		});

		expect(await template.render()).toBe(inputPartialRenderedTemplate)
	});

	test('renders partial template if no commands', async () => {
		const configClone = Object.assign({}, config);

		delete configClone.commands
		
		const template = new Template(templateBody, configClone);
		inquirer.prompt.mockResolvedValue({value: 'prompt'});
		shell.exec.mockResolvedValue('command');

		expect(await template.render()).toBe(inputPartialRenderedTemplate)
	});

	test('renders partial template if no user inputs', async () => {
		const configClone = Object.assign({}, config);

		delete configClone.userInputs
		
		const template = new Template(templateBody, configClone);
		inquirer.prompt.mockResolvedValue({value: 'prompt'});
		shell.exec.mockResolvedValue('command');

		expect(await template.render()).toBe(commandPartialRenderedTemplate)
	});


});
