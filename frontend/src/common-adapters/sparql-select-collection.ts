import { sparqlRoot } from 'config.json';
import Collection from '../core/collection';

import ItemGraph from './item-graph';

/**
 * SparqlSelectCollection is a collection type specifically geared for issueing
 * SPARQL `SELECT` queries to our own backend. It's somewhat similar to
 * `ItemGraph`, but with regular `Model`s instead of `Node`s and with fewer
 * bells and whistles.
 */
interface SparqlSelectCollection extends Pick<ItemGraph, 'sparqlEndpoint' | 'promise' | 'sparqlQuery'> {}

class SparqlSelectCollection extends Collection {
    constructor(graphName: string) {
        super(null, { graphName });
    }

    preinitialize(models, options: any): void {
        super.preinitialize(models, options);
        this.sparqlEndpoint = `${sparqlRoot}${options.graphName}/query`;
    }

    parse(response) {
        return response.results.bindings;
    }
}

SparqlSelectCollection.prototype.sparqlQuery = ItemGraph.prototype.sparqlQuery;

export default SparqlSelectCollection;
