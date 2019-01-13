const Github = require('../src/Github.js');
const Config = require('../src/Config.js');
const testConfig = require('../.ghpr.json')

const config = new Config();

describe('Config', () => {
    describe('constructor', () => {
        it('returns config if file exists', () => {
            expect(typeof config.config).toBe('object')
            expect(config.config).toEqual(testConfig)
        })

        it('returns empty config if file doesnt exist', () => {
            jest.mock('../src/Github.js');
            Github.rootDir = jest.fn( () => 'blah' )
            const config = new Config();
            expect(typeof config.config).toBe('object')
            expect(config.config).toEqual({})
        })
 
    })

});


