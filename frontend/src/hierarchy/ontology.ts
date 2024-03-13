/**
 * In this module, we define an algorithm that will construct a model hierarchy
 * according to the convention described in ./hierarchy-view, based on an input
 * ontology.
 */

import { map, groupBy, keys, propertyOf, pick, flatten } from 'lodash';

import Model from '../core/model';
import Collection from '../core/collection';
import { rdfs, skos } from '../common-rdf/ns';
import Subject from '../common-rdf/subject';
import FlatItem from '../common-adapters/flat-item-model';

type Nodeish = Subject | FlatItem;
type Clustering = Record<string, Nodeish[]>;
type Traversal = ReturnType<typeof optionalGet>;

// Function factory for traversing a Subject based on a given property.
function optionalGet(property: string) {
    return function(node: Nodeish) {
        const cls: Subject = node.get('class') || node;
        const value = cls.get(property) as Subject[];
        if (value && value.length) return value[0].id;
    }
}

const skosRelated = optionalGet(skos.related);
const superClass = optionalGet(rdfs.subClassOf);

// Iteratee generator for collection membership in a secondary container.
const isInternal = collection => id => collection.has(id);

// Recursively build a model hierarchy, starting from an outer model.
function asOuterModel(clustering: Clustering) {
    return function(node: Nodeish) {
        const model = new Model({ model: node });
        if (node.id in clustering) {
            model.set('collection', buildHierarchy(clustering, node.id as string));
        }
        return model;
    }
}

// Recursively build a model hierarchy, starting from a collection.
function buildHierarchy(clustering: Clustering, name?: string) {
    return new Collection(map(clustering[name], asOuterModel(clustering)));
}

// Overall algorithm factory. Concrete versions only differ by the method of
// traversal.
function hierarchyOverRelation(traverse: Traversal) {
    return function(collection: Collection<Nodeish>): Collection {
        let clustering = groupBy(collection.models, traverse);
        const toplevel = clustering['undefined'] || [];
        delete clustering['undefined'];
        const internalKeys = groupBy(
            keys(clustering), isInternal(collection)
        );
        const external = map(internalKeys['false'], propertyOf(clustering))
        clustering = pick(clustering, internalKeys['true'])
        clustering['undefined'] = toplevel.concat(flatten(external));
        return buildHierarchy(clustering);
    };
}

export const hierarchyFromOntology = hierarchyOverRelation(skosRelated);
export const hierarchyFromNLPOntology = hierarchyOverRelation(superClass);
