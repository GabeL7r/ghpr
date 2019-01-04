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

    async createPr() {
        debuglog('Creating pull request...');
        try {
            const r = await client.repo(`${owner}/${repoName}`).prAsync({
                title,
                base,
                head,
                body,
            });
        } catch (e) {
            if (e.body.errors[0].message.includes('A pull request already exists')) {
                console.log(`A pull request already exists for ${head} -> ${base} in ${owner}/${repoName}`);
            } else {
                console.log(
                    'Unable to create pull request.  Try running application with NODE_DEBUG=ghpr to troubleshoot'
                );
                debuglog(JSON.stringify(e));
            }
        }
    }

    async addLabel() {
        const issueNumber = r[0].number;
        debuglog(`Pull Request ${issueNumber} created.`);

        if (labels.length > 0) {
            debuglog('Adding labels to Pull Request...');
            await client.issue(`${owner}/${repoName}`, issueNumber).addLabelsAsync(labels);
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
