import user from '../global/user';
import ldChannel from '../common-rdf/radio';
import itemsTemplate from './query-templates/items-for-source-template';

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
    let data = { sourceURI: source };
    const hasAllViewPerm = user.hasPermission('view_all_annotations');
    if (!hasAllViewPerm) data['userURI'] = ldChannel.request('current-user-uri');
    const finalData = { ...data, ...options };

    return itemsTemplate(finalData).replace(/ {2,}/g, ' '); // strip double spaces
}
