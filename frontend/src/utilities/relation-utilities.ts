import { forEach, some, compact, keys, ListIterator, isString } from 'lodash';

import Collection from '../core/collection';
import ldChannel from '../common-rdf/radio';
import { rdf, rdfs, owl, item } from '../common-rdf/ns';
import Graph from '../common-rdf/graph';
import Subject from '../common-rdf/subject';
import ItemGraph from '../common-adapters/item-graph';
import { getLabel, getRdfSuperClasses } from '../utilities/linked-data-utilities';

/**
 * Returns the inverse property of `direct` within the context of `ontology`.
 */
export function getInverse(direct: Subject, ontology: Graph): Subject {
    let inverse: Subject | Subject[] = direct.get(owl.inverseOf) as Subject[];
    if (inverse) {
        inverse = inverse[0];
    } else {
        inverse = ontology.find({
            [owl.inverseOf]: direct,
        } as unknown as ListIterator<Subject, boolean>);
    }
    return inverse;
}

/**
 * Helper for filtering properties by matching type of domain or range.
 */
export function matchRelatee(direction: string, types: Subject[]) {
    return function(property: Subject): boolean {
        return some(types, t => property.has(direction, t));
    }
}

/**
 * Returns a Graph with all direct and inverse predicates applicable to `model`.
 * If `model` is a bare string, it is assumed to name the range type.
 * This function runs entirely sync.
 */
export function applicablePredicates(model: Subject | string): Graph {
    const seed = isString(model) ? [model] : model.get('@type') as string[];
    const allTypes = getRdfSuperClasses(seed);
    const predicates = new Graph();
    const ontology = ldChannel.request('ontology:graph') as Graph;
    // predicates that can have model in subject position
    predicates.add(ontology.filter(matchRelatee(rdfs.domain, allTypes)));
    // predicates that can have model in object position (need inverse)
    ontology.filter(matchRelatee(rdfs.range, allTypes)).forEach(direct => {
        let inverse = getInverse(direct, ontology);
        if (!inverse) inverse = new Subject({
            '@type': rdf.Property,
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
 * Converts individual Subject attributes to (predicate, object) models.
 * Some of the models are added async.
 */
export function relationsFromModel(model: Subject, predicates: Graph) {
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
        (model.get(a, {'@type': '@id'}) as Subject[]).forEach(object =>
            (object.id as string).startsWith(item()) && relations.add({predicate, object})
        );
    });
    // Next, inverse relations sourced from other Subjects
    const inverseMap: {[id: string]: Subject} = {};
    const inversePredicates = new Graph(compact(predicates.map(direct => {
        const inverse = getInverse(direct, ontology);
        if (!inverse) return;
        inverseMap[inverse.id] = direct;
        return inverse;
    })));
    inverseRelated.ready(() => {
        inverseRelated.forEach(subject => {
            const attributes = keys(subject.attributes);
            attributes.forEach(a => {
                const inverse = inversePredicates.get(a);
                if (!inverse || !subject.has(a, model)) return;
                const direct = inverseMap[inverse.id];
                relations.add({predicate: direct, object: subject});
            });
        });
        relations.trigger('complete', relations);
    });
    return relations;
}
