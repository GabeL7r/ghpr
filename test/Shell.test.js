const shell = require('../src/Shell.js');

describe('Shell', () => {
    test('exec throws an error if command not found', async () => {
        try {
            await shell.exec('foo bar')
        } catch(e) {
            expect(e).not.toBe(null)
        }
    });
    test('exec returns value if command found', async () => {
        try {
            expect(await shell.exec('echo "hello world"')).toBe('hello world')
        } catch(e) {
            expect(e).toBe(null)
        }
    });
    test('exec returns value and doesnt fail for program writing to stdout', async () => {
        try {
            expect(await shell.exec('>&2 echo error')).toBe('error')
        } catch(e) {
            expect(e).toBe(null)
        }
    });
});
