import user from '../global/user';
import ldChannel from '../common-rdf/radio';
import itemsTemplate from './query-templates/items-for-source-template';
import itemsByUserTemplate from './query-templates/items-by-user-template';
import sourcesByUserTemplate from './query-templates/sources-by-user-template';

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
    filterMax?: number;
    filterMin?: number;
}

export function itemsForSourceQuery(source: string, { ...options }: SPARQLQueryOptions) {
    let data = { sourceURI: source, from: 'source' };
    const hasAllViewPerm = user.hasPermission('view_all_annotations');
    if (!hasAllViewPerm) data['userURI'] = ldChannel.request('current-user-uri');
    const finalData = { ...data, ...options };
    return itemsTemplate(finalData).replace(/ {2,}/g, ' '); // strip double spaces
}

export function itemsByUserQuery(user: string, { ...options }: SPARQLQueryOptions) {
    const data = { userURI: user, ...options };
    return itemsByUserTemplate(data).replace(/ {2,}/g, ' ');
}

export function sourcesByUserQuery(user: string, { ... options }: SPARQLQueryOptions) {
    const data = { userURI: user, ...options };
    return sourcesByUserTemplate(data).replace(/ {2,}/g, ' ');
}
