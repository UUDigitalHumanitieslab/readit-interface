import Model from '../core/model';
import { source, item, nsTable, nsMap } from '../common-rdf/ns';
import userChannel from '../common-user/user-radio';

import itemsTemplate from './query-templates/items-for-source-template';
import countNodesTemplate from './query-templates/count-nodes-template';
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

export function countNodesQuery(
    itemQuery: boolean, options: SPARQLQueryOptions = {}
) {
    const data = { ...defaultOptions, itemQuery, ...options };
    return countNodesTemplate(data);
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
    itemQuery: boolean, options: SPARQLQueryOptions = { limit: 10 }
) {
    const nsLength = (itemQuery ? source() : item()).length;
    const data = { ...defaultOptions, itemQuery, nsLength, ...options };
    return randomNodesTemplate(data);
}
