import Graph from "../jsonld/graph";
import Node from "../jsonld/node";


const defaultGraphs = [
    'http://www.w3.org/1999/02/22-rdf-syntax-ns.jsonld',
    'http://www.w3.org/2000/01/rdf-schema.jsonld',
    'https://www.w3.org/2002/07/owl.jsonld',
    'http://www.w3.org/ns/oa.jsonld',
    'https://www.w3.org/ns/activitystreams.jsonld',
    'http://schema.org/version/latest/schema.jsonld',
]

export default class GraphStore {
    /**
     * Store the urls of the Graphs already present in the store.
     */
    private collectedGraphs: string[];

    store: Graph;

    /**
     *
     */
    constructor() {
        this.collectedGraphs = [];
        this.store = new Graph();
    }

    get(id: string): Node {

    }

    /**
     * Extract the base url from the node's id and supplement it with '.jsonld'.
     */
    getUrl(id: string): string {
        let index = id.indexOf("#");

        if (index <= 0) {
            index = id.lastIndexOf('/');
        }

        return `${id.substr(0, index)}.jsonld`;
    }
}
