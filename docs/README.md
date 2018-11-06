## GHPR
-------
CLI tool to create Pull Requests on GitHub.


### Features
-------
* Create a Pull Request from your terminal
* Prompt users for information to be included in a Pull Request Template
* Include output of terminal commands in Pull Request Template
* Add labels to Pull Request

### Quick Start
-------
```shell
npm install -g @codesherpas/ghpr
```

Create a [GitHub Access Token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/) and add it to your Git Config

```shell
git config --global github.token <token>
```

Create a configuration file .ghpr.json in the root of your project.

```json
{
	"templateVariables": {
		"userInputs": {
			"why": {
				"message": "Why is this change needed: "
			},
			"ticketNumber": {
				"message": "Jira ticket number: "
			}
		},
		"commands": {
			"testCoverage": "npm test"
		}
	}
}
```

Add a Pull Request Template file named .github/pull_request_template.md.

```
## Link to Jira
https://codesherpas7.atlassian.net/browse/{{ticketNumber}}

## Why
<!-- describe why this change is needed -->
{{why}}

## Test Coverage Results
<!-- include results of test coverage -->
{{testCoverage}}
```

Create a pull request.

```shell
ghpr
```

