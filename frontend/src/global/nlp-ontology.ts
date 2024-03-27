/**
 * This module provides global access to the ontology. While the
 * ontology is provided as a default export, this is only meant for
 * other global and aspect modules; unit modules should only access
 * the ontology indirectly through the linked data radio channel. The
 * ontology is fetched lazily, i.e., not before it is first requested.
 *
 * This module provides its service through one trigger and five
 * requests:

    ldChannel.trigger('cache:nlp-ontology')

 * This will cause the module to fetch the ontology. Useful to
 * trigger caching of the ontology in code that doesn't actually use
 * the ontology.

    ldChannel.request('nlp-ontology:promise')

 * Returns a promise that resolves to a Graph containing the fetched
 * ontology. Will cause a request if the ontology hasn't been fetched
 * yet. Useful in async code that must reliably access the fully
 * fetched ontology.

    ldChannel.request('nlp-ontology:graph')

 * Returns a Graph that will eventually contain the ontology. Will
 * cause a request if the ontology hasn't been fetched yet. Useful in
 * sync code that can wait until a later event in order to access the
 * ontology Subjects, or in sync code where it is reasonable to assume
 * that the ontology has already been fetched.

    ldChannel.request('nlp-ontology:colored')

 * Like the previous, but returns a FilteredCollection with only the
 * colored classes in the ontology.

    ldChannel.request('nlp-ontology:flatColored')

 * Like the previous, but with all colored classes represented as flat items.

    ldChannel.request('nlp-ontology:hierarchy')

 * Like the previous, but converted to a model hierarchy according to the
 * convention described in ../hierarchy/hierarchy-view. This replies with a
 * promise to the hierarchy, rather than the hierarchy itself.
 */

import { constant } from 'lodash';

import Collection from '../core/collection';
import ldChannel from '../common-rdf/radio';
import { nlp } from '../common-rdf/ns';
import Subject from '../common-rdf/subject';
import Graph from '../common-rdf/graph';
import FilteredCollection from '../common-adapters/filtered-collection';
import FlatItemCollection from '../common-adapters/flat-item-collection';
import { hierarchyFromNLPOntology } from '../hierarchy/ontology';
import { isColoredClass } from '../utilities/linked-data-utilities';

const nlpOntology = new Graph();
export default nlpOntology;
let promise: PromiseLike<Graph> = null;
export const coloredClasses = new FilteredCollection<Subject, Graph>(
    nlpOntology, isColoredClass
);
export const flatColored = new FlatItemCollection(coloredClasses);
const coloredComplete = new Promise(
    resolve => flatColored.once('complete:all', resolve)
);
let hierarchy: PromiseLike<Collection> = null;

/**
 * The function that takes care of the lazy fetching.
 */
function ensurePromise(): PromiseLike<Graph> {
    if (promise) return promise;
    promise = nlpOntology.fetch({ url: nlp() }).then(constant(nlpOntology));
    return promise;
}

/**
 * Take care of having a hierarchy of the colored classes.
 */
function ensureHierarchy(): PromiseLike<Collection> {
    hierarchy = hierarchy || Promise.all([
        ensurePromise(), coloredComplete
    ]).then(
        () => hierarchyFromNLPOntology(flatColored)
    );
    return hierarchy;
}

/**
 * Registering our services with the radio channel.
 */
ldChannel.once('cache:nlp-ontology', ensurePromise);
ldChannel.reply('nlp-ontology:promise', ensurePromise);
ldChannel.reply('nlp-ontology:graph', () => (ensurePromise(), nlpOntology));
ldChannel.reply('nlp-ontology:colored', () => (ensurePromise(), coloredClasses));
ldChannel.reply('nlp-ontology:flatColored', () => (ensurePromise(), flatColored));
ldChannel.reply('nlp-ontology:hierarchy', ensureHierarchy);
