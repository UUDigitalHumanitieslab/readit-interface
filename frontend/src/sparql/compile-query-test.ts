import { itemsForSourceQuery } from './compile-query';

describe('itemsForSourceQuery', function () {
    it('builds a query for annotations of a given source', function () {
        const source = 'example.com/42'
        let query = itemsForSourceQuery(source, undefined);
        expect(query).toContain('?target oa:hasSource <example.com/42>')
    });
});