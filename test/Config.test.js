const Github = require('../src/Github.js');
const Config = require('../src/Config.js');
const testConfig = require('../.ghpr.json');

describe('Config', () => {
    describe('get', () => {
        it('returns config if file exists', () => {
            expect(typeof Config.get).toBe('object');
            expect(Config.get).toEqual(testConfig);
        });

        it('returns empty config if file doesnt exist', () => {
            jest.mock('../src/Github.js');
            Github.rootDir = jest.fn(() => 'blah');
            expect(typeof Config.get).toBe('object');
            expect(Config.get).toEqual({});
        });
    });
});
