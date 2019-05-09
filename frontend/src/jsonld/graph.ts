import { extend, isArray, omit, isEmpty } from 'lodash';
import {
    compact,  // (jsonld, ctx, options?, callback?) => Promise<jsonld>
    expand,   // (jsonld, options?, callback?) => Promise<jsonld>
    flatten,  // (jsonld, ctx, options?, callback?) => Promise<jsonld>
    processContext,  // (activeCtx, localCtx, options?, callback?) => Promise<ctx>
    fromRDF,  // (string, options?, callback?) => Promise<jsonld>
    toRDF,    // (jsonld, options?, callback?) => Promise<dataset>
    registerRDFParser,  // (contentType, parser) => void
    get,      // (url, options?, callback?) => Promise<
} from 'jsonld';

import Collection from '../core/collection';
import {
    JsonValue,
    JsonObject,
    JsonArray,
    JsonCollection,
    JsonDocument,
    JsonLdContext,
    JsonLdDocument,
    JsonLdGraph,
    ResolvedContext,
} from './json';
import Node from './node';

export default class Graph extends Collection<Node> {
    /**
     * Information outside of the @graph, such as the global @context.
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
     * TODO: Override the sync method to flatten the JSON-LD response
     * before passing it to other methods.
     */

    /**
     * Separate the graph proper from global attributes. Set the
     * latter on the .meta node immediately.
     */
    parse(response: JsonLdDocument, options): JsonLdGraph {
        if (isArray(response)) return response;
        let meta = omit(response, '@graph');
        if (!isEmpty(meta)) {
            // TODO: clear properties on this.meta not in meta
            this.meta.set(meta);
        }
        return response['@graph'];
    }
}

extend(Graph.prototype, {
    model: Node,
});
