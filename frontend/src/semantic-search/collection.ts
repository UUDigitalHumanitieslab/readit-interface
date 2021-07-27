import { extend } from 'lodash';

import { apiRoot } from 'config.json';
import Collection from '../core/collection';

import SemanticQuery from './model';

export default class SemanticQueries extends Collection<SemanticQuery> {}

extend(SemanticQueries.prototype, {
    url: `${apiRoot}query/`,
    model: SemanticQuery,
});
