const Github = require('./Github.js');

const CONFIG = Symbol();

class Config {
    constructor() {
        this.rootDir = Github.rootDir();

        try {
            this[CONFIG] = require(`${this.rootDir}/.ghpr.json`);
        } catch (e) {
            this[CONFIG] = {};
        }
    }

    get config() {
        return this[CONFIG];
    }
}

module.exports = Config;
