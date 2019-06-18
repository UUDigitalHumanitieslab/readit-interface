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

import Collection from '../core/collection';
import {
    JsonLdDocument,
    JsonLdGraph,
    FlatLdDocument,
    FlatLdGraph,
    ResolvedContext,
} from './json';
import Node from './node';

export default class Graph extends Collection<Node> {
    /**
     * Information outside of the @graph, such as the global context.
     */
    meta: Node;

    /**
     * Forward meta.whenContext.
     */
    get whenContext(): Promise<ResolvedContext> {
        return this.meta.whenContext;
    }

    preinitialize(models, options) {
        this.meta = new Node();
    }

    /**
     * Compact data before sending a request, flatten before
     * returning the response.
     */
    async sync(
        method: string, graph: Graph, options: JQuery.AjaxSettings
    ): Promise<FlatLdDocument> {
        let { success, attrs } = options;
        let options = omit(options, 'success');
        let context = graph && graph.whenContext;
        if (method !== 'read' && context) {
            attrs = attrs || graph.toJSON(options);
            options.attrs = await compact(attrs, await context);
        }
        let jqXHR = sync(method, this, options);
        let response = await jqXHR as JsonLdDocument;
        // TODO: detect context presence and trigger event on graph(.meta)
        let flattened = await flatten(response);
        if (success) success(flattened, jqXHR.statusText, jqXHR);
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
