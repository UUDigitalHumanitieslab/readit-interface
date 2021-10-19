import userChannel from '../common-user/user-radio';
import itemsTemplate from './query-templates/items-for-source-template';
import listNodesTemplate from './query-templates/list-nodes-template';
import nodesByUserTemplate from './query-templates/nodes-by-user-template';
import randomNodesTemplate from './query-templates/random-nodes-template';
import Model from '../core/model';

export interface OrderByOption {
    expression: string,
    desc: boolean;
}

export interface NamespaceOption {
    label: string;
    prefix: string;
}

export interface SPARQLQueryOptions {
    namespaces?: NamespaceOption[];
    limit?: number;
    offset?: number;
    orderBy?: OrderByOption[];
}

export function itemsForSourceQuery(source: string, { ...options }: SPARQLQueryOptions) {
    let data = { sourceURI: source, from: 'source' };
    const perm = userChannel.request('permission', 'view_all_annotations');
    if (!perm) data['userURI'] = userChannel.request('current-user-uri');
    const finalData = { ...data, ...options };
    return itemsTemplate(finalData);
}

export function listNodesQuery(itemQuery: boolean, { ...options }: SPARQLQueryOptions) {   
    let data = { itemQuery: itemQuery, ...options }
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

export function randomNodesQuery(randomNodes: Model[], lastNode: Model, { ...options }: SPARQLQueryOptions) {
    const data = {randomNodes: randomNodes.map( model => model.get('value')), lastNode: lastNode.get('value'), ...options }
    return randomNodesTemplate(data);
}
