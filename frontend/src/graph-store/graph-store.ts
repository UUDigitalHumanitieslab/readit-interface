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

export class GraphStore {
    collectedGraphs: string[];



    store: Graph;



    /**
     *
     */
    constructor() {


    }

    get(id: string): Node {

    }

    extractUrl(id: string): string {

    }
}
