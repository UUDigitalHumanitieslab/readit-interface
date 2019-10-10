import { isArray, omit, map, defaultsDeep, each } from 'lodash';
import { compact, flatten } from 'jsonld';
import { parseLinkHeader } from 'jsonld/lib/util';
import { LINK_HEADER_REL } from 'jsonld/lib/constants';
import JsonLdError from 'jsonld/lib/JsonLdError';
import rdfParser from 'rdf-parse';
import * as Serializer from '@rdfjs/serializer-jsonld-ext';
import * as streamify from 'streamify-string';

import { syncWithCSRF } from '../core/csrf';
import { JsonLdContext, FlatLdDocument } from './json';
import Node from './node';
import Graph from './graph';

const contentTypeAlias = {
    'application/x-turtle': 'text/turtle',
};

const priorityOverrides = {
    'text/turtle': 0.8,
    'application/rdf+xml': 0.75,
    'text/html': 0.7,
    'application/xhtml+xml': 0.62,
    'application/n-quads': 0.6,
};

const defaultSyncOptions = (function() {
    let optionsPromise: any;

    return () => optionsPromise || (optionsPromise = async function() {
        const prioritized = await rdfParser.getContentTypesPrioritized();
        each(priorityOverrides, (prio, type) => {
            if (prioritized[type]) prioritized[type] = prio;
        });
        const formatted = map(prioritized, (prio, type) => `${type}; q=${prio}`);
        return {
            headers: {
                Accept: formatted.join(', '),
            },
            dataType: null, // default to jQuery's intelligent guess
        };
    }());
}());

/**
 * Compact data before sending a request, flatten before
 * returning the response.
 */
export default async function syncLD(
    method: string, model: Node | Graph, options: any
): Promise<FlatLdDocument> {
    let { success, error, attrs } = options;
    options = omit(options, 'success', 'error');
    options = defaultsDeep(options, await defaultSyncOptions());
    let context = model && model.context;
    let jqXHR;
    try {
        if (context && (attrs || method !== 'read')) {
            attrs = attrs || model.toJSON(options);
            options.attrs = await compact(attrs, context);
        }
        jqXHR = syncWithCSRF(method, model, options);
        await jqXHR;
        const [flattened, newContext] = await transform(jqXHR);
        if (method !== 'delete') {
            model.trigger('sync:context', newContext);
        }
        if (success) success(flattened, jqXHR.statusText, jqXHR);
        return flattened;
    } catch (e) {
        if (error) error(jqXHR, jqXHR ? jqXHR.statusText : 'No request', e);
        throw e;
    }
}

export function transform(jqXHR: JQuery.jqXHR): Promise<[
    FlatLdDocument, JsonLdContext
]> {
    let contentType = jqXHR.getResponseHeader('Content-Type').split(';', 2)[0];
    contentType = contentTypeAlias[contentType] || contentType;
    let plaintext, context;
    if (contentType === 'application/json') {
        [plaintext, context] = combineContext(jqXHR);
    } else {
        plaintext = jqXHR.responseText;
    }
    const input = streamify(plaintext);
    const serializer = new Serializer();
    return new Promise((resolve, reject) => {
        let result: FlatLdDocument = [];
        const process = rdfParser.parse(input, {contentType});
        const output = serializer.import(process);
        output.on('data', jsonld => result = jsonld);
        output.on('end', () => resolve([result, context]));
        output.on('error', error => reject(error));
    });
}

export function combineContext(jqXHR) {
    const linkHeader = getLinkHeader(jqXHR);
    const parsedJson = jqXHR.responseJSON;
    const inlineContext = parsedJson['@context'];
    let fullContext = inlineContext;
    if (linkHeader) {
        if (inlineContext) {
            fullContext = [linkHeader.target, inlineContext];
        } else {
            fullContext = linkHeader.target;
        }
    }
    if (fullContext === inlineContext) return [jqXHR.responseText, fullContext];
    parsedJson['@context'] = fullContext;
    return [JSON.stringify(parsedJson), fullContext];
}

export function getLinkHeader(jqXHR) {
    // Logic roughly imitated from jsonld/lib/documentLoaders/xhr
    let linkHeader = jqXHR.getResponseHeader('Link');
    if (linkHeader) {
        linkHeader = parseLinkHeader(linkHeader)[LINK_HEADER_REL];
        if (isArray(linkHeader)) throw new JsonLdError(
            'More than one associated HTTP Link header.',
            'jsonld.InvalidUrl',
            {code: 'multiple context link headers', url: jqXHR.url},
        );
    }
    return linkHeader;
}
