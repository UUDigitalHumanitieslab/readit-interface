import { Namespace } from '../jsonld/vocabulary';
import AnnotationsForSourceTemplate from './query-templates/annotations-for-source-template';
import { Handlebars } from 'handlebars/lib/handlebars.runtime';
import ldChannel from '../jsonld/radio';

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
    return 'ORDER_BY ' + opts.join(' ');
}

function prefixesAsString(namespaces: NamespaceOption[]): string {
    let prefixes = namespaces.map(nsopt => {
        return `PREFIX ${nsopt.label}: <${nsopt.prefix}>`
    });
    return prefixes.join('\n')
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
        optionsData['orderby'] = orderByOptionsAsString(options.orderBy);
    }
    return optionsData;
}


export async function annotationsForSourceQuery(source: string, user: string = undefined, { ...options }: SPARQLQueryOptions) {
    let data = { source: source };
    if (user) {
        data['user'] = user
    }
    let optionsData = parseQueryOptions(options);
    let finalData = { ...data, ...optionsData };
    const currentUser = await ldChannel.request('current-user-uri');
    console.log(currentUser);

    // console.log(Handlebars.compile(AnnotationsForSourceTemplate)(data))
    return {
        template: AnnotationsForSourceTemplate,
        data: data
    }
}