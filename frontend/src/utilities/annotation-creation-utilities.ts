import * as _ from 'lodash';
import * as a$ from 'async';

import Node, { isNode }  from '../common-rdf/node';
import { oa, as, vocab, rdf, xsd, staff, dcterms, rdfs, schema, readit } from '../common-rdf/ns';
import FlatItem from '../common-adapters/flat-item-model';
import ItemGraph from '../common-adapters/item-graph';

import { isBlank } from './linked-data-utilities';
import {
    AnnotationPositionDetails,
    getPositionDetails ,
    placeholderClass,
} from './annotation-utilities';

const prefixLength = 100;
const suffixLength = 100;

/**
 * Get an instance of oa:TextQuoteSelector that is not synced to the backend,
 * and doesn't have an @id. Ideal for passing a user selection('s Range) to
 * the AnnotationEditView.
 */
export function getTextQuoteSelector(range: Range): Node {
    let prefix = getPrefix(range);
    let suffix = getSuffix(range);

    let selector = new Node({
        '@id': _.uniqueId('_:'),
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
        '@id': _.uniqueId('_:'),
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
    ], done);
}

/**
 * Guarded version of `createItem`.
 */
function createIfBlankOrNew(items: ItemGraph, attributes: any, done?) {
    if (attributes) {
        if (!isNode(attributes)) attributes = new Node(attributes);
        if (isBlank(attributes)) attributes.unset('@id');
        if (attributes.isNew()) return createItem(items, attributes, done);
        items.add(attributes);
    }
    if (!done) return Promise.resolve(attributes);
    a$.nextTick(done, null, attributes);
}

function getPositionSelector(start: number, end: number){
    return new Node({
        '@id': _.uniqueId('_:'),
        '@type': oa.TextPositionSelector,
        [oa.start]: start,
        [oa.end]: end,
    });
}

function getSpecificResource(source: Node, positionSelector: Node, textQuoteSelector: Node){
    return new Node({
        '@id': _.uniqueId('_:'),
        '@type': oa.SpecificResource,
        [oa.hasSource]: source,
        [oa.hasSelector]: [positionSelector, textQuoteSelector],
    });
}

function saveSpecificResource(
    items: ItemGraph,
    target: Node,
    [positionSelector]: [Node, unknown, unknown],
    [quoteSelector]: [Node, unknown, unknown],
    done?
) {
    // Replace former blank node selectors by their respective IRIs.
    target.unset(oa.hasSelector);
    target.set(oa.hasSelector, [positionSelector, quoteSelector]);
    return createIfBlankOrNew(items, target, done);
}

function saveAnnotation(
    items: ItemGraph,
    annotation: Node,
    [target]: [Node, unknown, unknown],
    item: [Node, unknown, unknown] | Node | undefined,
    done?
) {
    // Erase the old blank node item reference if applicable.
    const blankBody = _.find(annotation.get(oa.hasBody), isBlank);
    if (blankBody) annotation.unset(oa.hasBody, blankBody);
    if (item) annotation.set(oa.hasBody, isNode(item) ? item : item[0]);
    // Replace blank node target by IRI.
    annotation.unset(oa.hasTarget).set(oa.hasTarget, target);
    return createIfBlankOrNew(items, annotation, done);
}

/**
 * Create a placeholder annotation, either by cloning from an existing FlatItem
 * or by creating one from scratch given a source and selection details.
 */
export function createPlaceholderAnnotation(existing: FlatItem): Node;
export function createPlaceholderAnnotation(
    source: Node, range: Range, positionDetails: AnnotationPositionDetails
): Node;
export function createPlaceholderAnnotation(source, range?, positionDetails?) {
    let textQuoteSelector, positionSelector;
    if (isNode(source)) { // "From scratch" mode.
        textQuoteSelector = getTextQuoteSelector(range);
        positionSelector = getPositionSelector(
            positionDetails.startIndex, positionDetails.endIndex
        );
    } else { // Clone mode.
        textQuoteSelector = cloneTextQuoteSelector(source);
        positionSelector = getPositionSelector(
            source.get('startPosition'), source.get('endPosition')
        );
        source = source.get('source');
    }
    const specificResource = getSpecificResource(
        source, positionSelector, textQuoteSelector
    );
    return new Node({
        '@id': _.uniqueId('_:'),
        '@type': oa.Annotation,
        [oa.hasTarget]: specificResource,
        [oa.hasBody]: [placeholderClass]
    });
}

export function savePlaceholderAnnotation(placeholder: FlatItem, done?) {
    const inputs = {
        pSelector: placeholder.get('positionSelector'),
        qSelector: placeholder.get('quoteSelector'),
        target: placeholder.get('target'),
        item: placeholder.get('item'),
        anno: placeholder.get('annotation'),
        items: new ItemGraph(),
    };

    const tasks = {
        positionSelector: [ 'items', 'pSelector', createIfBlankOrNew ],
        quoteSelector: [ 'items', 'qSelector', createIfBlankOrNew ],
        specificResource: [
            'items', 'target', 'positionSelector', 'quoteSelector',
            saveSpecificResource,
        ],
        body: [ 'items', 'item', createIfBlankOrNew ],
        annotation: [
            'items', 'anno', 'specificResource', 'body',
            saveAnnotation,
        ],
    };

    return a$.autoInject(combineAutoHash(inputs, tasks), done);
}
