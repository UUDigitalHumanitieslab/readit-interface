import * as _ from 'lodash';
import * as a$ from 'async';

import Node  from '../common-rdf/node';
import { oa, as, vocab, rdf, xsd, staff, dcterms, rdfs, schema } from '../common-rdf/ns';

import FlatItem from '../common-adapters/flat-item-model';
import ItemGraph from '../common-adapters/item-graph';
import { AnnotationPositionDetails, getPositionDetails } from './annotation-utilities';
import { uniqueId } from 'lodash';

const prefixLength = 100;
const suffixLength = 100;

/**
 * Get an instance of oa:TextQuoteSelector that is not synced to the backend,
 * and doesn't have an @id. Ideal for passing a user selection('s Range) to
 * the AnnotationEditView.
 */
export function getAnonymousTextQuoteSelector(range: Range): Node {
    let prefix = getPrefix(range);
    let suffix = getSuffix(range);

    let selector = new Node({
        '@type': [oa.TextQuoteSelector],
        [oa.exact]: [
            {
                "@value": range.toString()
            }
        ]
    });

    if (prefix) selector.set(oa.prefix, prefix);
    if (suffix) selector.set(oa.suffix, suffix);
    return selector;
}

/**
 * For an existing annotation, clone its text quote selector
 * Creates new Node, so that we can edit the range for each annotation separately
 * @param previousAnnotation: FlatItem
 */
export function cloneTextQuoteSelector(previousAnnotation: FlatItem){
    let selector = new Node({
        '@type': [oa.TextQuoteSelector],
        [oa.exact]: [
            {
                "@value": previousAnnotation.get('text')
            }
        ]
    });
    if (previousAnnotation.has('prefix')) selector.set(oa.prefix, previousAnnotation.get('prefix'));
    if (previousAnnotation.has('suffix')) selector.set(oa.suffix, previousAnnotation.get('suffix'));
    return selector;
}

function getPrefix(exactRange: Range): string {
    let startIndex = exactRange.startOffset - prefixLength;
    if (startIndex < 0) startIndex = 0;
    let prefixRange = document.createRange();
    prefixRange.setStart(exactRange.startContainer, startIndex);
    prefixRange.setEnd(exactRange.startContainer, exactRange.startOffset);
    let result = prefixRange.toString();
    prefixRange.detach();
    return result;
}

function getSuffix(exactRange: Range): string {
    let endIndex = exactRange.endOffset + suffixLength;
    if (endIndex > exactRange.endContainer.textContent.length) {
        endIndex = exactRange.endContainer.textContent.length;
    }
    let suffixRange = document.createRange();
    suffixRange.setStart(exactRange.endContainer, exactRange.endOffset);
    suffixRange.setEnd(exactRange.endContainer, endIndex);
    let result = suffixRange.toString();
    suffixRange.detach();
    return result;
}

/**
 * Create an annotation, with all relevant Nodes (e.g. oa.Specificresource, oa.Selector, etc) to store the information.
 * @param source
 * @param posDetails
 * @param tQSelector
 * @param ontoClass
 * @param done Callback function.
 */
export function composeAnnotation(
    source: Node,
    posDetails: AnnotationPositionDetails,
    tQSelector: Node,
    ontoClass: Node,
    ontoItem?: Node,
    done?
) {
    const { startIndex, endIndex } = posDetails;

    const inputs = {
        startIndex, endIndex,
        source, ontoClass, ontoItem, tQSelector, items: new ItemGraph(),
    };

    const tasks = {
        positionSelector: ['items', 'startIndex', 'endIndex',
            createPositionSelector,
        ],
        textQuoteSelector: ['items', 'tQSelector',
            createTextQuoteSelector,
        ],
        specificResource: ['items', 'source', 'positionSelector', 'textQuoteSelector',
            createSpecificResource,
        ],
        instance: ['items', 'ontoClass', 'ontoItem',
            createOntologyInstance,
        ],
        annotation: ['items', 'specificResource', 'ontoClass', 'instance',
            createAnnotation,
        ],
    };
    return a$.autoInject(combineAutoHash(inputs, tasks), done);
}

/**
 * Utility function that takes two plain objects, inputs and tasks, and returns a new plain object which combines them.
 * In the combined object, all keys from inputs have been wrapped in a$.constant while the keys from tasks are copied as-is.
 * Therefore, the returned object contains only tasks, but some of them are “fake”, i.e., the wrapped inputs
 * @param inputs
 * @param tasks
 */
function combineAutoHash(inputs, tasks) {
    const asyncifiedInputs = _.mapValues(inputs, constant => [a$.constant(constant)]);
    return _.extend(asyncifiedInputs, tasks);
}

/**
 * Takes a callback and returns a new one that has null prepended to its arguments.
 */
function unshiftArgs(callback) {
    return _.partial(callback, null);
}

/**
 * Returns an async function which completes when emitter triggers the name event.
 * @param emitter
 * @param name
 * @param transformCb Can be passed to adapt the callback (done) to an event emitter that does’t follow the error-first
 * convention. By default _.identity is applied, meaning that the callback is used as-is
 */
function watchEvent(emitter, name, transformCb = _.identity) {
    return (done) => emitter.once(name, (...args) => {
        transformCb(done)(...args)
    });
}

/**
 * A wrapper around watchEvent which takes successful and failed completion from different events.
 * Returns an async function  which completes with whichever event happens first (i.e. success or error).
 * @param success Success event name.
 * @param error Optional. If you do not specify an error event, it is wise to wrap the returned async function in a$.timeout
 * so that other tasks that depend on it won’t wait forever.
 * @param getVal Specify to change success callback. Default to unshiftArgs.
 * @param getErr Specify to change error callback.
 */
function awaitEvent(success, error?, getVal = unshiftArgs, getErr?) {
    return function(emitter, done) {
        const tasks = [watchEvent(emitter, success, <any>getVal)];
        if (error) tasks.push(watchEvent(emitter, error, getErr));
        return a$.race(tasks, done);
    }
}

/**
 * Callback adapter.
 * Transforms (model, jqXHR, options) into (* the error from jqXHR *)
 * @param callback
 */
function errorFromXHR(callback) {
    return (_, xhr, options) => {
        callback(options.error);
    }
}

/**
 * Save an item to the backend. If succesful returns a Node with a guaranteed @id.
 * @param items Instance of ItemGraph used to .create a Node.
 * @param attributes Either a plain object { 'foo': 'bar' } or an instantiated Node.
 * @param done Callback function.
 */
function createItem(items: ItemGraph, attributes: any, done?) {
    return a$.waterfall([
        a$.constant(items.create(attributes)),
        awaitEvent('sync', 'error', unshiftArgs, errorFromXHR),
    ], (error, results) => done(error, results));
}

function createOntologyInstance(
    items: ItemGraph,
    ontoClass: Node,
    attributes?: Node,
    done?
) {
    if (attributes) return createItem(items, attributes, done);
    if (!done) return Promise.resolve(attributes);
    a$.nextTick(done, null, attributes);
}

function createTextQuoteSelector(items: ItemGraph, textQuoteSelector: Node, done?) {
    return createItem(items, textQuoteSelector.attributes, done);
}

function createPositionSelector(items: ItemGraph, start: number, end: number, done?) {
    const attributes = getPositionSelector(start, end);
    return createItem(items, attributes, done);
}

function getPositionSelector(start: number, end: number){
    return {
        '@type': oa.TextPositionSelector,
        [oa.start]: start,
        [oa.end]: end,
    };
}

function createSpecificResource(items: ItemGraph, source: Node, positionSelector: Node, textQuoteSelector: Node, done?) {
    const attributes = getSpecificResource(source, positionSelector, textQuoteSelector);
    return createItem(items, attributes, done);
}

function getSpecificResource(source: Node, positionSelector: Node, textQuoteSelector: Node){
    return {
        '@type': oa.SpecificResource,
        [oa.hasSource]: source,
        [oa.hasSelector]: [positionSelector, textQuoteSelector],
    };
}

function createAnnotation(
    items: ItemGraph,
    specificResource: Node,
    ontoClass: Node,
    ontoItem?: Node,
    done?
) {
    const attributes = {
        '@type': oa.Annotation,
        [oa.hasBody]: [ontoClass],
        [oa.hasTarget]: specificResource,
        [as.generator]: {'@id': vocab('self')},
    };
    if (ontoItem) (attributes[oa.hasBody] as Node[]).push(ontoItem);
    return createItem(items, attributes, done);
}

function getPlaceholderClass() {
    return {
        '@id': 'placeholder',
        '@type': [rdfs.Class],
        [schema.color]: ['#a8c0f4']
    }
}

export function createPlaceholderAnnotation(
    source: Node,
    textQuoteSelector: Node,
    positionDetails: AnnotationPositionDetails
) {
    let positionSelector = getPositionSelector(positionDetails.startIndex, positionDetails.endIndex);
    positionSelector['@id'] = uniqueId('_:');
    let specificResource = getSpecificResource(source, new Node(positionSelector), textQuoteSelector);
    specificResource['@id'] = uniqueId('_:');
    const placeholderClass = getPlaceholderClass();
    return {
        '@type': oa.Annotation,
        [oa.hasTarget]: specificResource,
        [oa.hasBody]: [placeholderClass]
    }
}
