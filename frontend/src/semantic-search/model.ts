import { pick, extend, map, mapValues, has, isArray, isObject } from 'lodash';

import Model from '../core/model';
import Collection from '../core/collection';
import ldChannel from '../common-rdf/radio';
import Graph from '../common-rdf/graph';

import { logic, filters } from './dropdown-constants';

function pruneResources(json: any): any {
    if (!isObject(json)) return json;
    if (isArray(json)) return map(json, pruneResources);
    if (has(json, '@id')) return pick(json, '@id');
    if (has(json, 'id')) return pick(json, 'id');
    return mapValues(json, pruneResources);
}

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

export default class SemanticQuery extends Model {
    toJSON(options?: any): any {
        const json = super.toJSON(options);
        return mapValues(json, pruneResources);
    }

    parse(json: any): any {
        return mapValues(json, parseQuery);
    }
}
