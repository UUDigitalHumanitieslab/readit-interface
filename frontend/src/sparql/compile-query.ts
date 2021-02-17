import user from '../global/user';
import ldChannel from '../common-rdf/radio';
import annotationsTemplate from './query-templates/annotations-for-source-template';
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


function orderByOptionsAsString(options: OrderByOption[]): string {
    let opts = options.map(opt => {
        return opt.desc ? `DESC(?${opt.expression})` : `?${opt.expression})`
    });
    return 'ORDER BY ' + opts.join(' ');
}

function parseQueryOptions(options: SPARQLQueryOptions) {
    let optionsData = {};
    if (options.namespaces) {
        optionsData['namespaces'] = options.namespaces;
    }
    if (options.limit) {
        optionsData['limit'] = options.limit;
    }
    if (options.offset && options.limit) {
        optionsData['offset'] = options.offset;
    }
    if (options.orderBy) {
        optionsData['orderBy'] = orderByOptionsAsString(options.orderBy);
    }
    return optionsData;
}

export function annotationsForSourceQuery(source: string, user: string = undefined, { ...options }: SPARQLQueryOptions) {
    let data = { sourceURI: source };
    if (user) {
        data['userURI'] = user
    }
    let optionsData = parseQueryOptions(options);
    let finalData = { ...data, ...optionsData };
    return annotationsTemplate(finalData);
}

export function itemsForSourceQuery(source: string, { ...options }: SPARQLQueryOptions) {
    let data = { sourceURI: source };
    const hasAllViewPerm = user.hasPermission('view_all_annotations');
    if (!hasAllViewPerm) data['userURI'] = ldChannel.request('current-user-uri');
    const finalData = { ...data, ...parseQueryOptions(options) };

    return itemsTemplate(finalData)
        // strip double spaces
        // TODO: strip other whitespace? leave it all intact?
        .replace(/ {2,}/g, ' ')
        ;
}