import Model from '../core/model';
import { nsTable, nsMap } from '../common-rdf/ns';
import userChannel from '../common-user/user-radio';

import itemsTemplate from './query-templates/items-for-source-template';
import listNodesTemplate from './query-templates/list-nodes-template';
import nodesByUserTemplate from './query-templates/nodes-by-user-template';
import randomNodesTemplate from './query-templates/random-nodes-template';

export interface OrderByOption {
    expression: string,
    desc: boolean;
}

export interface SPARQLQueryOptions {
    namespaces?: nsTable;
    limit?: number;
    offset?: number;
    orderBy?: OrderByOption[];
}

const defaultOptions = {
    namespaces: nsMap,
};

export function itemsForSourceQuery(
    source: string, options: SPARQLQueryOptions = {}
) {
    let data = { sourceURI: source, from: 'source' };
    const perm = userChannel.request('permission', 'view_all_annotations');
    if (!perm) data['userURI'] = userChannel.request('current-user-uri');
    const finalData = { ...defaultOptions, ...data, ...options };
    return itemsTemplate(finalData);
}

export function listNodesQuery(
    itemQuery: boolean, options: SPARQLQueryOptions = {}
) {
    let data = { ...defaultOptions, itemQuery: itemQuery, ...options };
    return listNodesTemplate(data);
}

export function nodesByUserQuery(
    itemQuery: boolean, options: SPARQLQueryOptions = {}
) {
    const userURI = userChannel.request('current-user-uri');
    if (!userURI) {
        throw new Error('no authenticated user (hint: await user promise)');
    }
    const data = { ...defaultOptions, itemQuery, userURI, ...options };
    return nodesByUserTemplate(data);
}

export function randomNodesQuery(
    randomNodes: Model[], lastNode: Model, options: SPARQLQueryOptions = {}
) {
    const data = {
        ...defaultOptions,
        randomNodes: randomNodes.map( model => model.get('value')),
        lastNode: lastNode.get('value'),
        ...options,
    };
    return randomNodesTemplate(data);
}
