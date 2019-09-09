import InvalidUrl from 'jsonld';
import Graph from "../jsonld/graph";
import Node from "../jsonld/node";
import { Exception } from 'handlebars';

// http://purl.org/dc/terms/created

const defaultGraphs = [
    'https://www.w3.org/1999/02/22-rdf-syntax-ns',
    // 'https://www.w3.org/2000/01/rdf-schema',
    // 'https://www.w3.org/2002/07/owl',
    // 'https://www.w3.org/ns/oa',
    // 'https://www.w3.org/ns/activitystreams',
    // 'https://schema.org/version/latest/schema.jsonld',
]

export default class GraphStore {
    /**
     * Store the urls of the Graphs already present in the store.
     */
    private collectedGraphs: string[];

    private failedUrls: string[];

    store: Graph;

    /**
     *
     */
    constructor() {
        this.collectedGraphs = [];
        this.failedUrls = [];
        this.store = new Graph();
    }

    async get(id: string): Promise<Node> {
        let baseUrl = this.getUrl(id);

        if (this.collectedGraphs.indexOf(baseUrl) === -1 && this.failedUrls.indexOf(baseUrl) === -1) {
            let error = false;

            try {
                await this.fetch(
                    id,
                    (collection, response, options) => {
                        this.addToStore(baseUrl, collection);
                    },
                    (collection, response, options) => {
                        error = true;
                        this.failedUrls.push(baseUrl);
                    }
                );
            }
            catch (InvalidUrl) {
                // json ld throws InvalidUrl if the response is not JSON
                error = true;
            }

            if (error) return Promise.resolve(new Node({ '@id': id }));
            return this.store.get(id);
        }
        else {
            return Promise.resolve(this.store.get(id));
        }
    }

    async collectDefaults(): Promise<void> {
        await Promise.all(defaultGraphs.map(async (url) => {
            return await this.get(url);
        }));

        return Promise.resolve(null);
    }

    /**
     * Extract the base url from the node's id (i.e. remove everything from the last '#' or '/').
     */
    getUrl(id: string): string {
        let index = id.indexOf("#");

        if (index <= 0) {
            index = id.lastIndexOf('/');
        }

        return `${id.substr(0, index)}`;
    }

    private fetch(
        url: string,
        success: (collection, response, options) => void,
        error: (collection, response, options) => void): Promise<void> {
        let g = new Graph();

        return g.fetch({
            url: url,
            headers: { 'Accept': 'application/ld+json' }, // 'Content-Type': 'application/json'
            error: error,
            success: success
        });
    }

    private addToStore(url: string, graph: Graph) {
        this.collectedGraphs.push(url);
        this.store.add(graph.models);
    }
}
