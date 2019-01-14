require('@babel/polyfill');
const Github = require('./Github.js');

class Config {
    static get get() {
        this.rootDir = Github.rootDir();

        try {
            return require(`${this.rootDir}/.ghpr.json`);
        } catch (e) {
            return {};
        }

    }
}

module.exports = Config;
