require('@babel/polyfill');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const debug = util.debuglog('shell');

class Shell {
    static async exec(command) {
        try {
            let { stdout, stderr } = await exec(command, { maxBuffer: 1024 * 2000 });

            debug('stdout: ', stdout);
            debug('stderr: ', stderr);
            if (stderr) throw stderr;

            return stdout.trim();
        } catch (e) {
            throw e;
        }
    }
}

module.exports = Shell;
