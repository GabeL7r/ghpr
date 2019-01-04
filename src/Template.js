function getRootLevel() {
    return shell.exec('git rev-parse --show-toplevel').stdout.trim();
}

async function renderBody() {
    try {
        let body = fs.readFileSync(`${getRootLevel()}/.github/pull_request_template.md`, 'utf8');

        const userInputs = config.get('templateVariables.userInputs');
        const commands = config.get('templateVariables.commands');
        return Promise.each(Object.keys(userInputs), key => {
            return inquirer
                .prompt({
                    type: 'input',
                    name: key,
                    default: userInputs[key].default || '',
                    message: userInputs[key].message,
                    validate: function(text) {
                        if (text.length < 0) {
                            return `Value cannot be empty`;
                        }
                        return true;
                    },
                })
                .then(r => {
                    body = body.replace(`{{${key}}}`, r[key]);
                });
        })
            .then(() => {
                return Promise.each(Object.keys(commands), c => {
                    body = body.replace(`{{${c}}}`, shell.exec(commands[c]).stdout.trim());
                });
            })
            .then(() => body);
    } catch (e) {
        debuglog('Could not render template: ', e);

        return inquirer
            .prompt({
                type: 'input',
                name: 'body',
                message: 'Enter Pull Request Body: ',
            })
            .then(r => r.body);
    }
}
