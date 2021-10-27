import { constant } from 'lodash';

import userChannel from '../common-user/user-radio';
import { itemsForSourceQuery } from './compile-query';

beforeEach(function() {
    userChannel.reply('permission', constant(true));
});

describe('itemsForSourceQuery', function () {
    it('builds a query for annotations of a given source', function () {
        const source = 'example.com/42'
        let query = itemsForSourceQuery(source);
        expect(query).toContain('?target oa:hasSource <example.com/42>')
    });
});