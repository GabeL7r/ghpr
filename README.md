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
```

Add a Pull Request Template file named .github/pull_request_template.md.

```
## Why
<!-- describe why this change is needed -->
<%= why %>

## Test Coverage
<%= testCoverage %>
```

Create a pull request.

```shell
ghpr
```

> Note: templates are rendered using ejs

