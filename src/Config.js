const config = convict({
    githubToken: {
        doc: 'GitHub Token.',
        format: String,
        default: '',
        env: 'GITHUB_TOKEN',
    },
    templateVariables: {
        userInputs: {
            doc: 'Replace template variables with user prompted input.',
            format: Object,
            default: {},
        },
        commands: {
            doc: 'Replace template variables with output of executed commands.',
            format: Object,
            default: {},
        },
    },
});

try {
    config.loadFile(`${getRootLevel()}/.ghpr.json`);
    config.validate({ allowed: 'strict' });
} catch (e) {
    debuglog('Could not load config file.');
}
