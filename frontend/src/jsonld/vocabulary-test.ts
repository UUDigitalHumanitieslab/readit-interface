import Vocabulary from './vocabulary';

const terms = ['apple', 'banana', 'cherry'] as const;
const vocab = Vocabulary('http://fruits.edu/', terms);

describe('Vocabulary constructor', function() {
    it('creates a special function, which', function() {
        expect(vocab).toEqual(jasmine.any(Function));
    });

    it('... returns the namespace prefix by default', function() {
        expect(vocab()).toBe('http://fruits.edu/');
    });

    it('... appends passed arguments to the prefix', function() {
        expect(vocab('test')).toBe('http://fruits.edu/test');
    });

    it('... has a precomputed member for each constructor term', function() {
        expect(vocab.apple).toBe('http://fruits.edu/apple');
        expect(vocab.banana).toBe('http://fruits.edu/banana');
        expect(vocab.cherry).toBe('http://fruits.edu/cherry');
    });

    it('... is type-safe', function() {
        /**/  // remove second slash to break compilation (don't commit!)
        pending('Edit this test to check that compilation fails.')
        /*/
        expect(vocab.test).toBeUndefined();
        // Actually, we expect the following compiler error:
        // Error TS2339: Property 'test' does not exist on type
        // 'Namespace<readonly ["apple", "banana", "cherry"]>'
        // */
    });
});
