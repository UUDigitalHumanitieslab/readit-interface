import { extend, result, isString } from 'lodash';

import { item } from '../common-rdf/ns';
import Subject from '../common-rdf/subject';
import Graph from '../common-rdf/graph';
import { asURI } from '../utilities/linked-data-utilities';

import { nsRoot, sparqlRoot } from 'config.json';

/**
 * Using query parameters is DEPRECATED in favor of SPARQL queries.
 */
export interface QueryParamsURI {
    predicate?: Subject | string;
    object?: Subject | string;
}
export interface QueryParamsLiteral {
    predicate?: Subject | string;
    objectLiteral?: string;
}

/**
 * Using traversal parameters is DEPRECATED in favor of SPARQL queries.
 *
 * Pass these parameters to ItemGraph.query to fetch not only the
 * Nodes that match the given predicate and/or object, but also
 * related Nodes up to the given number of steps.
 *
 * Suppose that you fetch a Subject, item:x, with the following triple.

        item:x oa:hasTarget item:y

 * If you pass traverse: 1, the response will not only include item:x,
 * but also all Nodes that appear in the object position in item:x.
 * In the above example, that includes at least item:y. Now suppose
 * that item:y has the following triple.

        item:y oa:hasSelector item:z

 * The traverse: 1 option means that you perform this step only once,
 * so item:z will not be included in the response. To repeat this step
 * and also include item:z, simply pass traverse: 2 instead.
 *
 * The revTraverse option performs a similar lookup but in reverse
 * direction. If you pass revTraverse: 1, the response will include
 * item:w if it has the following triple.

        item:w oa:hasBody item:x

 * Traversal always yields whole Nodes.
 */
export interface TraversalParams {
    traverse?: number;
    revTraverse?: number;
}

export interface DownloadParam {
    download?: boolean;
}

export type QueryParams = (QueryParamsURI | QueryParamsLiteral) & TraversalParams & DownloadParam;

function isURIQuery(params: QueryParams): params is QueryParamsURI {
    return (params as QueryParamsURI).object !== undefined;
}

function isLiteralQuery(params: QueryParams): params is QueryParamsLiteral {
    return (params as QueryParamsLiteral).objectLiteral !== undefined;
}

/**
 * Useful Collection subclass for interacting with the backend item
 * store.
 *
 * To save a new Subject to an item store, run

    anItemStore.create(theSubject | theAttributes)

 * this returns either `theSubject` or a new Subject constructed with
 * `theAttributes`. In both cases, the returned Subject will emit an
 * 'error' event if creation fails. Wait for 'change:@id' before
 * using the Subject as an attribute value for another Subject.
 *
 * See also the query and sparqlQuery methods below for querying the server.
 */
export default class ItemGraph extends Graph {
    sparqlEndpoint: string;

    // Only defined if a query has been issued.
    promise: JQuery.jqXHR;

    /**
     * We allow client code to override `this.url` through the `graph` option.
     * For convenience, it is also possible to pass just the graph URL directly
     * as the only argument.
     *
     * From `this.url`, we derive the matching `this.sparqlEndpoint`.
     */
    constructor(graph: string);
    constructor(models?: Subject[] | Object[], options?: any);
    constructor(models?: Subject[] | Object[] | string, options?) {
        if (isString(models)) {
            options = { graph: models };
            models = null;
        }
        super(models, options);
    }

    preinitialize(models?, options?: any): void {
        super.preinitialize(models, options);
        if (options.graph) this.url = options.graph;
        const url = result(this, 'url') as string;
        const graphName = url.slice(nsRoot.length, -1);
        this.sparqlEndpoint = `${sparqlRoot}${graphName}/query`;
    }

    /**
     * DEPRECATED you still need this for the download parameter, but use
     * sparqlQuery instead if you don't use that parameter.
     *
     * Replace the contents of this graph by all items at the backend
     * that match the given criteria.
     *
     * The request runs async. Wait for the 'sync' or 'update' event
     * or await the returned promise in order to use the results.
     */
    query(params: QueryParams): JQuery.jqXHR {
        const data: any = {};
        if (params.predicate) data.p = asURI(params.predicate);
        if (isURIQuery(params)) data.o = asURI(params.object);
        if (isLiteralQuery(params)) data.o_literal = params.objectLiteral;
        if (params.download) data.download = params.download;
        if (params.traverse) data.t = params.traverse;
        if (params.revTraverse) data.r = params.revTraverse;
        return this.promise = this.fetch({data});
    }

    /**
     * Replace the contents of this graph by all items at the backend that
     * result from the given CONSTRUCT query. For best results, make sure that
     * the query produces complete items.
     */
    sparqlQuery(query: string): JQuery.jqXHR {
        return this.promise = this.fetch({
            url: this.sparqlEndpoint,
            data: $.param({ query }),
        });
    }

    /**
     * Invokes the given callback when the most recent query completes.
     */
    ready(callback: (ItemGraph) => any): this {
        if (!this.promise) throw new Error('No query was issued.');
        this.promise.then(callback);
        return this;
    }
}

extend(ItemGraph.prototype, {
    url: item(),
});

if (window['DEBUGGING']) {
    window['ItemGraph'] = ItemGraph;
}
