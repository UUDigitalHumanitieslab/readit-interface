import { forEach, some, keys, ListIterator } from 'lodash';

import Collection from '../core/collection';
import ldChannel from '../jsonld/radio';
import { rdfs, owl, item } from '../jsonld/ns';
import Graph from '../jsonld/graph';
import Node from '../jsonld/node';
import ItemGraph from '../utilities/item-graph';
import { getLabel, getRdfSuperClasses } from '../utilities/utilities';

/**
 * Returns the inverse property of `direct` within the context of `ontology`.
 */
export function getInverse(direct: Node, ontology: Graph): Node {
    let inverse: Node | Node[] = direct.get(owl.inverseOf) as Node[];
    if (inverse) {
        inverse = inverse[0];
    } else {
        inverse = ontology.find({
            [owl.inverseOf]: direct,
        } as unknown as ListIterator<Node, boolean>);
    }
    return inverse;
}

/**
 * Helper for filtering properties by matching type of domain or range.
 */
export function matchRelatee(direction: string, types: Node[]) {
    return function(property: Node): boolean {
        return some(types, t => property.has(direction, t));
    }
}

/**
 * Returns a Graph with all direct and inverse predicates applicable to model.
 * This function runs entirely sync.
 */
export function applicablePredicates(model: Node): Graph {
    const allTypes = getRdfSuperClasses(model.get('@type') as string[]);
    const predicates = new Graph();
    const ontology = ldChannel.request('ontology:graph') as Graph;
    // predicates that can have model in subject position
    predicates.add(ontology.filter(matchRelatee(rdfs.domain, allTypes)));
    // predicates that can have model in object position (need inverse)
    ontology.filter(matchRelatee(rdfs.range, allTypes)).forEach(direct => {
        let inverse = getInverse(direct, ontology);
        if (!inverse) inverse = new Node({
            [rdfs.label]: `inverse of ${getLabel(direct)}`,
            [owl.inverseOf]: direct,
        });
        if (!inverse.has(rdfs.domain)) {
            inverse.set(rdfs.domain, direct.get(rdfs.range));
        }
        if (!inverse.has(rdfs.range)) {
            inverse.set(rdfs.range, direct.get(rdfs.domain));
        }
        predicates.add(inverse);
    });
    return predicates;
}

/**
 * Converts individual Node attributes to (predicate, object) models.
 * Some of the models are added async.
 */
export function relationsFromModel(model: Node, predicates: Graph) {
    const inverseRelated = ldChannel.request(
        'cache:inverse-related',
        model,
    ) as ItemGraph;
    const ontology = ldChannel.request('ontology:graph') as Graph;
    // First, direct relations sourced from the model itself
    const relations = new Collection();
    const attributes = keys(model.attributes);
    forEach(attributes, a => {
        const predicate = predicates.get(a);
        if (!predicate) return;
        (model.get(a, {'@type': '@id'}) as Node[]).forEach(object =>
            object.id.startsWith(item()) && relations.add({predicate, object})
        );
    });
    // Next, inverse relations sourced from other Nodes
    const inverseMap: {[id: string]: Node} = {};
    const inversePredicates = new Graph(predicates.map(direct => {
        const inverse = getInverse(direct, ontology);
        inverseMap[inverse.id] = direct;
        return inverse;
    }));
    inverseRelated.ready(() => inverseRelated.forEach(node => {
        const attributes = keys(node.attributes);
        attributes.forEach(a => {
            const inverse = inversePredicates.get(a);
            if (!inverse || !node.has(a, model)) return;
            const direct = inverseMap[inverse.id];
            relations.add({predicate: direct, object: node});
        });
        relations.trigger('complete', relations);
    }));
    return relations;
}
