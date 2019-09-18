import { defaults, has, isUndefined, isString, isArray } from 'lodash';

import { proxyRoot } from 'config.json';

import { Identifier, FlatLdDocument, FlatLdGraph } from './json';
import Node from './node';
import Graph from './graph';

const fetchOptions = {
    headers: {
        Accept: 'application/ld+json',
    },
    remove: false,
    merge: true,
};

/**
 * Global graph that contains all Nodes ever fetched or created
 * during application runtime. Meant to be used as a singleton
 * instance.
 */
export default class Store extends Graph {
    /**
     * Main interface. Ensures every @id is represented by a single unique Node.
     */
    request(id: string | Identifier | Node): Node {
        const initialResult = this.get(id as string | Node);
        if (isUndefined(initialResult)) {
            const placeholder = this.getPlaceholder(id);
            this.import(placeholder.id);
            return placeholder;
        }
        return initialResult;
    }

    /**
     * Create, store and return a placeholder for a missing Node.
     */
    getPlaceholder(id: string | Identifier | Node): Node {
        let placeholder;
        if (id instanceof Node) {
            placeholder = id;
        } else if (isString(id)) {
            placeholder = new Node({'@id': id});
        } else if (has(id, '@id')) {
            placeholder = new Node(id);
        } else {
            throw TypeError('id must be string, Identifier or Node');
        }
        this.add(placeholder);
        return placeholder;
    }

    /**
     * Fetch all triples related to a resource and update.
     */
    import(url: string): this {
        let xhr = this.fetch(defaults({url}, fetchOptions));
        // retry via proxy if the initial request fails
        xhr.catch(this.importViaProxy.bind(this, url));
        return this;
    }

    /**
     * Like import, but send the request through our own proxy.
     */
    importViaProxy(url: string): this {
        this.fetch(defaults({url: `${proxyRoot}${url}`}, fetchOptions));
        return this;
    }

    /**
     * Override Graph.parse in order to leave the meta Node unchanged.
     */
    parse(response: FlatLdDocument, options): FlatLdGraph {
        if (isArray(response)) {
            if (response.length !== 1) return response;
            response = response[0];
            if (!response['@graph']) return [response];
        }
        return response['@graph'];
    }
}
