import { extend, isArray, isUndefined, omit, isEmpty } from 'lodash';
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
    FlatLdDocument,
    FlatLdGraph,
    JsonLdContext,
} from './json';
import Node from './node';
import sync from './sync';

export default class Graph extends Collection<Node> {
    /**
     * Information outside of the @graph, such as the global context.
     */
    meta: Node;

    /**
     * Forward the meta context.
     */
    get context(): JsonLdContext {
        return this.meta.context;
    }
    set context(newGlobal: JsonLdContext) {
        this.meta.context = newGlobal;
    }

    preinitialize(models, options) {
        this.meta = new Node();
        this.meta.on('change:@context', (model, newGlobal, oldGlobal) => {
            this.trigger('change:@context', this, newGlobal, oldGlobal);
        });
    }

    /**
     * The ctor allows you to set/override the context on creation.
     */
    constructor(models?, options?) {
        super(models, options);
        let context: JsonLdContext = options && options.context;
        if (!isUndefined(context)) this.context = context;
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
    sync,
});
