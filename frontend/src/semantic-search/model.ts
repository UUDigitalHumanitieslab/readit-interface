import {
    pick,
    extend,
    map,
    mapValues,
    has,
    isArray,
    isObject ,
    isFunction,
} from 'lodash';

import Model from '../core/model';
import Collection from '../core/collection';
import ldChannel from '../common-rdf/radio';
import Graph from '../common-rdf/graph';

import { logic, filters } from './dropdown-constants';

// Core recursive implementation of SemanticQuery.toJSON. Traverse recursive
// datastructure `json` and return a copy in which all models and collections
// are replaced by their plain JSON representations and models with an id are
// reduced to a plain object with only the id attribute.
function pruneResources(json: any): any {
    if (!isObject(json)) return json;
    if (isFunction(json['toJSON'])) return pruneResources(json['toJSON']());
    if (isArray(json)) return map(json, pruneResources);
    if (has(json, '@id')) return pick(json, '@id');
    if (has(json, 'id')) return pick(json, 'id');
    return mapValues(json, pruneResources);
}

// Core recursive implementation of SemanticQuery.parse, the inverse of
// pruneResources. Since pruneResources is lossy, full recovery is only possible
// because we have domain-specific knowledge of our internal data model.
function parseQuery(json: any, key?: string | number): any {
    if (!isObject(json)) return json;
    if (isArray(json)) {
        const data = map(json, parseQuery);
        if (key === 'range') return new Graph(data);
        return new Collection(data);
    }
    if (has(json, '@id')) return ldChannel.request('obtain', json);
    if (has(json, 'id')) {
        return logic.get(json as Model) || filters.get(json as Model);
    }
    return new Model(mapValues(json, parseQuery));
}

/**
 * SemanticQuery is our frontend representation of the semantic query as it is
 * saved at the backend. Its `query` attribute contains the rich intermediate
 * representation (IR) as described in the README. The `toJSON` and `parse`
 * methods take care of converting the IR respectively to and from the leaner
 * JSON representation that is exchanged with the backend. These methods are
 * called automatically when we use the built-in `save` and `fetch` methods, so
 * we don't need to invoke them explicitly.
 */
export default class SemanticQuery extends Model {
    toJSON(options?: any): any {
        const json = super.toJSON(options);
        return mapValues(json, pruneResources);
    }

    parse(json: any): any {
        return mapValues(json, parseQuery);
    }
}
