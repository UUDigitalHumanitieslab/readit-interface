import { isArray, omit } from 'lodash';
import { sync as syncBase } from 'backbone';
import { compact, flatten } from 'jsonld';
import { parseLinkHeader } from 'jsonld/lib/util';
import { LINK_HEADER_REL } from 'jsonld/lib/constants';
import JsonLdError from 'jsonld/lib/JsonLdError';

import { JsonLdDocument, FlatLdDocument } from './json';
import Node from './node';
import Graph from './graph';

/**
 * Compact data before sending a request, flatten before
 * returning the response.
 */
export default async function syncLD(
    method: string, model: Node | Graph, options: any
): Promise<FlatLdDocument> {
    let { success, error, attrs } = options;
    options = omit(options, 'success', 'error');
    let context = model && model.whenContext;
    let jqXHR;
    try {
        if (context && (attrs || method !== 'read')) {
            attrs = attrs || model.toJSON(options);
            options.attrs = await compact(attrs, await context);
        }
        jqXHR = syncBase(method, model, options);
        let response = await jqXHR as JsonLdDocument;
        let flattenOptions: any = { base: response['@base'] || options.url };
        let linkHeader = getLinkHeader(jqXHR);
        if (linkHeader) flattenOptions.expandContext = linkHeader.target;
        let flattened = await flatten(response, null, flattenOptions);
        if (method !== 'delete') {
            emitContext(linkHeader, response['@context'], model);
        }
        if (success) success(flattened, jqXHR.statusText, jqXHR);
        return flattened;
    } catch (e) {
        if (error) error(jqXHR, jqXHR ? jqXHR.statusText : 'No request', e);
        throw e;
    }
}

export function getLinkHeader(jqXHR) {
    // Logic roughly imitated from jsonld/lib/documentLoaders/xhr
    if (jqXHR.getResponseHeader('Content-Type') !== 'application/ld+json') {
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
}

export function emitContext(linkHeader, inlineContext, model) {
    let newContext = inlineContext;
    if (linkHeader) {
        if (inlineContext) {
            newContext = [linkHeader.target, inlineContext];
        } else {
            newContext = linkHeader.target;
        }
    }
    model.trigger('sync:context', newContext);
}
