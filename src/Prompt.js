const prompts = {
    title: {
        type: 'input',
        name: 'title',
        message: 'Pull Request Title: ',
        validate: function(text) {
            if (text.length < 0) {
                return 'Must include a title.';
            }
            return true;
        },
    },
    base: {
        type: 'input',
        name: 'base',
        default: 'master',
        message: 'Base Branch: ',
    },
    head: function(base) {
        return {
            type: 'input',
            name: 'head',
            default: shell.exec('git rev-parse --abbrev-ref HEAD').stdout.trim(),
            message: 'Head Branch: ',
            validate: function(text) {
                if (base === text) {
                    return 'Base and Head branch must be different.';
                }

                return true;
            },
        };
    },
    labels: function(labels) {
        return {
            type: 'checkbox',
            message: 'Select Labels: ',
            name: 'labels',
            choices: labels,
        };
    },
};
