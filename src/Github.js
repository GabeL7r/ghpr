require('@babel/polyfill');
const https = require('https');
const util = require('util');
const debug = util.debuglog('github');

class Github {
    constructor(token, owner, repo) {
        this._token = token;
        this._owner = owner;
        this._repo = repo;
    }

    async getLabels() {
        debug('Getting labels associated with this project on GitHub...');
        try {
            const path = `/repos/${this._owner}/${this._repo}/labels`;
            const labels = await this._request('GET', path);

            const formattedLabels = labels.map(l => {
                return { name: l.name };
            });
            debug('Formatted labels are: ', formattedLabels);
            return formattedLabels;
        } catch (e) {
            debug("Couldn't retrieve labels.", e);
            console.error('Could not retrieve labels for repository');
            return [];
        }
    }

    async createPr({ title, base, head, body }) {
        debug('Creating pull request', title, base, head, body);
        try {
            const path = `/repos/${this._owner}/${this._repo}/pulls`;
            const pr = await this._request('POST', path, {
                title,
                base,
                head,
                body,
            });

            if (pr.message === 'Validation Failed') {
                console.log(pr.errors[0].message);
                process.exit(1);
            }
            return pr.number;
        } catch (e) {
            console.log(e);
			console.log(
				'Unable to create pull request.  Try running application with NODE_DEBUG=ghpr to troubleshoot'
			);
			debug(JSON.stringify(e));
        }
    }

    async addLabel(issueNumber, labels) {
        debug('Adding label to pull request', issueNumber, labels);
        try {
            const path = `/repos/${this._owner}/${this._repo}/issues/${issueNumber}/labels`;
            await this._request('POST', path, labels);
        } catch (e) {
            debug("Couldn't add labels to pr.", e);
            return [];
        }
    }
    _request(method, path, postData) {
        const options = {
            host: 'api.github.com',
            method,
            path,
            headers: {
                Authorization: `token ${this._token}`,
                Accept: 'application/vnd.github.machine-man-preview+json',
                'User-Agent': 'ghpr',
            },
        };

        debug('GitHub API Options', options);
        return new Promise(function(resolve, reject) {
            const req = https
                .request(options, function(resp) {
                    let data = '';

                    resp.on('data', chunk => {
                        data += chunk;
                    });
                    resp.on('end', () => {
                        resolve(JSON.parse(data));
                    });
                })
                .on('error', err => {
                    console.error(err);
                    reject(err);
                });

            postData && req.write(JSON.stringify(postData));
            req.end();
        });
    }
}
module.exports = Github;
