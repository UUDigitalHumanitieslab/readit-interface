import { extend, isArray, omit, isEmpty } from 'lodash';
import { sync } from 'backbone';
import {
    compact,  // (jsonld, ctx, options?, callback?) => Promise<jsonld>
    expand,   // (jsonld, options?, callback?) => Promise<jsonld>
    flatten,  // (jsonld, ctx, options?, callback?) => Promise<jsonld>
    processContext,  // (activeCtx, localCtx, options?, callback?) => Promise<ctx>
    fromRDF,  // (string, options?, callback?) => Promise<jsonld>
    toRDF,    // (jsonld, options?, callback?) => Promise<dataset>
    registerRDFParser,  // (contentType, parser) => void
} from 'jsonld';
import { parseLinkHeader } from 'jsonld/lib/util';
import { LINK_HEADER_REL } from 'jsonld/lib/constants';
import JsonLdError from '.jsonld/lib/JsonLdError';

import Collection from '../core/collection';
import {
    JsonLdDocument,
    JsonLdGraph,
    FlatLdDocument,
    FlatLdGraph,
    JsonLdContext,
    ResolvedContext,
} from './json';
import Node from './node';

function getLinkHeader(jqXHR) {
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

function emitContext(linkHeader, inlineContext, model) {
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

export default class Graph extends Collection<Node> {
    /**
     * Information outside of the @graph, such as the global context.
     */
    meta: Node;

    /**
     * Forward the meta context.
     */
    get whenContext(): Promise<ResolvedContext> {
        return this.meta.whenContext;
    }
    setContext(context: JsonLdContext): this {
        this.meta.setContext(context);
        return this;
    }

    preinitialize(models, options) {
        this.meta = new Node();
    }

    /**
     * Compact data before sending a request, flatten before
     * returning the response.
     */
    async sync(
        method: string, model: Node | Graph, options: JQuery.AjaxSettings
    ): Promise<FlatLdDocument> {
        let { success, attrs } = options;
        let options = omit(options, 'success');
        let context = model && model.whenContext;
        if (method !== 'read' && context) {
            attrs = attrs || model.toJSON(options);
            options.attrs = await compact(attrs, await context);
        }
        let jqXHR = sync(method, this, options);
        let response = await jqXHR as JsonLdDocument;
        let flattenOptions = { base: response['@base'] || options.url };
        let linkHeader = getLinkHeader(jqXHR);
        if (linkHeader) flattenOptions.expandContext = linkHeader.target;
        let flattened = await flatten(response, null, flattenOptions);
        if (method !== 'delete') {
            emitContext(linkHeader, response['@context'], model);
        }
        if (success) {
            success(flattened, jqXHR.statusText, jqXHR);
        }
        return flattened;
    }

    /**
     * Separate the graph proper from global attributes. Set the
     * latter on the .meta node immediately.
     */
    parse(response: FlatLdDocument, options): FlatLdGraph {
        if (isArray(response)) return response;
        let meta = omit(response, '@graph');
        if (!isEmpty(meta)) {
            // TODO: clear properties on this.meta not in meta
            this.meta.set(meta);
        }
        return response['@graph'];
    }

    /**
     * TODO: override toJSON to include the data from this.meta
     */
}

extend(Graph.prototype, {
    model: Node,
});
