import user from '../global/user';
import ldChannel from '../common-rdf/radio';
import itemsTemplate from './query-templates/items-for-source-template';
import listNodesTemplate from './query-templates/list-nodes-template';
import sourcesByUserTemplate from './query-templates/sources-by-user-template';
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
    const hasAllViewPerm = user.hasPermission('view_all_annotations');
    if (!hasAllViewPerm) data['userURI'] = ldChannel.request('current-user-uri');
    const finalData = { ...data, ...options };
    return itemsTemplate(finalData).replace(/ {2,}/g, ' '); // strip double spaces
}

export function listNodesQuery(itemQuery: boolean, { ...options }: SPARQLQueryOptions) {   
    let data = { itemQuery: itemQuery, ...options }
    return listNodesTemplate(data);
}

export function nodesByUserQuery(itemQuery: boolean, { ...options }: SPARQLQueryOptions) {  
    const data = {userURI: ldChannel.request('current-user-uri')};
    const finalData = { ...data, ...options };
    return nodesByUserTemplate(finalData);
}

export function randomNodesQuery(randomNodes: Model[], lastNode: Model, { ...options }: SPARQLQueryOptions) {
    const data = {randomNodes: randomNodes.map( model => model.get('value')), lastNode: lastNode.get('value'), ...options }
    return randomNodesTemplate(data);
}

export function sourcesByUserQuery(user: string, { ... options }: SPARQLQueryOptions) {
    const data = { userURI: user, ...options };
    return sourcesByUserTemplate(data).replace(/ {2,}/g, ' ');
}
