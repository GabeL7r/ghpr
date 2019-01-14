const Octokit = function() {
    this.authenticate = jest.fn();
    this.issues = {};
    this.issues.listLabelsForRepo = jest.fn().mockResolvedValue({ data: [{ name: 'bug' }, { name: 'wip' }] });

    this.issues.addLabels = jest.fn().mockImplementation(({ number, labels }) => {
        if (!number || !labels) return Promise.reject(new Error());
        else return Promise.resolve('worked');
    });

    this.pulls = {};
    this.pulls.create = jest.fn().mockImplementation(({ base }) => {
        if (base)
            return Promise.resolve({
                data: {
                    url: 'https://testurl',
                    number: 42,
                },
            });
        else return Promise.reject(new Error());
    });

    return this;
};

module.exports = Octokit;
