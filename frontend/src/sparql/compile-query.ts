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
    return userChannel.request('permission', 'view_all_annotations').then( perm => {
        if (!perm) data['userURI'] = userChannel.request('current-user-uri');
        const finalData = { ...data, ...options };
        return itemsTemplate(finalData);
    });
}

export function listNodesQuery(itemQuery: boolean, { ...options }: SPARQLQueryOptions) {   
    let data = { itemQuery: itemQuery, ...options }
    return listNodesTemplate(data);
}

export async function nodesByUserQuery(itemQuery: boolean, { ...options }: SPARQLQueryOptions) {  
    const uri = await userChannel.request('current-user-uri');
    if (!uri) {
        return null;
    }
    const data = {itemQuery: itemQuery, userURI: uri};
    const finalData = { ...data, ...options };
    return nodesByUserTemplate(finalData);
}

export function randomNodesQuery(randomNodes: Model[], lastNode: Model, { ...options }: SPARQLQueryOptions) {
    const data = {randomNodes: randomNodes.map( model => model.get('value')), lastNode: lastNode.get('value'), ...options }
    return randomNodesTemplate(data);
}
