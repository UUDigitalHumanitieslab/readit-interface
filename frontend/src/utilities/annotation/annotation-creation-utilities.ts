import * as _ from 'lodash';
import * as a$ from 'async';

import Node  from './../../jsonld/node';
import { oa, vocab, rdf, xsd, staff, dcterms, } from './../../jsonld/ns';

import ItemGraph from './../../utilities/item-graph';
import { AnnotationPositionDetails } from './annotation-utilities';

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

    let tqs = new Node({
        '@type': [oa.TextQuoteSelector],
        [oa.exact]: [
            {
                "@value": range.toString()
            }
        ]
    });

    if (prefix) tqs.set(oa.prefix, prefix);
    if (suffix) tqs.set(oa.suffix, suffix);
    return tqs;
}

function getPrefix(exactRange: Range): string {
    let startCharacterIndex = exactRange.startOffset - prefixLength;
    if (startCharacterIndex < 0) startCharacterIndex = 0;
    let prefixRange = document.createRange();
    prefixRange.setStart(exactRange.startContainer, startCharacterIndex);
    prefixRange.setEnd(exactRange.startContainer, exactRange.startOffset);
    let result = prefixRange.toString();
    prefixRange.detach();
    return result;
}

function getSuffix(exactRange: Range): string {
    let endCharacterIndex = exactRange.endOffset + suffixLength;
    if (endCharacterIndex > exactRange.endContainer.textContent.length) {
        endCharacterIndex = exactRange.endContainer.textContent.length;
    }
    let suffixRange = document.createRange();
    suffixRange.setStart(exactRange.endContainer, exactRange.endOffset);
    suffixRange.setEnd(exactRange.endContainer, endCharacterIndex);
    let result = suffixRange.toString();
    suffixRange.detach();
    return result;
}


export function composeAnnotation(source: Node, posDetails: AnnotationPositionDetails, ontoClass: Node, tQSelector: Node, done?) {
    const { startNodeIndex, startCharacterIndex, endNodeIndex, endCharacterIndex } = posDetails;

    const inputs = {
        startNodeIndex, startCharacterIndex, endNodeIndex, endCharacterIndex,
        source, ontoClass, tQSelector, items: new ItemGraph(),
    };

    const tasks = {
        startSelector: ['items', 'startNodeIndex', 'startCharacterIndex',
            createXPathSelector,
        ],
        endSelector: ['items', 'endNodeIndex', 'endCharacterIndex', 'startSelector',
            createEndSelector,
        ],
        rangeSelector: ['items', 'startSelector', 'endSelector',
            createRangeSelector,
        ],
        textQuoteSelector: ['items', 'tQSelector', 'rangeSelector',
            createTextQuoteSelector,
        ],
        specificResource: ['items', 'source', 'rangeSelector', 'textQuoteSelector',
            createSpecificResource,
        ],
        // instance: ['items', 'ontoClass',
        //     createOntologyInstance
        // ],
        annotation: ['items', 'specificResource', 'ontoClass',
            createAnnotation,
        ],
    };
    return a$.autoInject(combineAutoHash(inputs, tasks), done);
}

function combineAutoHash(inputs, tasks) {
    const asyncifiedInputs = _.mapValues(inputs, constant => [a$.constant(constant)]);
    return _.extend(asyncifiedInputs, tasks);
}

function unshiftArgs(callback) {
    return _.partial(callback, null);
}

function watchEvent(emitter, name, transformCb = _.identity) {
    return (done) => emitter.once(name, (...args) => {
        transformCb(done)(...args)
    });
}

function awaitEvent(success, error?, getVal = unshiftArgs, getErr?) {
    return function(emitter, done) {
        const tasks = [watchEvent(emitter, success, <any>getVal)];
        if (error) tasks.push(watchEvent(emitter, error, getErr));
        return a$.race(tasks, done);
    }
}

function errorFromXHR(callback) {
    return (_, xhr, options) => {
        callback(options.error);
    }
}

function createItem(items: ItemGraph, attributes: any, done?) {
    return a$.waterfall([
        a$.constant(items.create(attributes)),
        awaitEvent('sync', 'error', unshiftArgs, errorFromXHR),
    ], (error, results) => done(error, results));
}

// This is here for when linking to an item is implemented (but needs updating as well)
function createOntologyInstance(items: ItemGraph, ontoClass: Node, done?) {
    return;
    const attributes = {
        '@type': ontoClass.id,
        // [skos.prefLabel]: getItemLabel(annotationText),
        [dcterms.created]: [
            {
                "@type": xsd.dateTime,
                "@value": "2085-12-31T04:33:16+0100"
            }
        ],
        [dcterms.creator]: [
            {
                "@id": staff('JdeKruif')
            }
        ],
    }
    return createItem(items, attributes, done);
}

function createTextQuoteSelector(items: ItemGraph, textQuoteSelector: Node, rangeSelector, done?) {
    return createItem(items, textQuoteSelector.attributes, done);
}

function createEndSelector(items: ItemGraph, container, offset, startSelector, done?) {
    createXPathSelector(items,  container, offset, done);
}

function createXPathSelector(items: ItemGraph, container, offset, done?) {
    const xPath = `substring(.//*[${container}]/text(), ${offset})`;
    const attributes = {
        '@type': oa.XPathSelector,
        [rdf.value]: xPath,
    };

    return createItem(items, attributes, done);
}

function createRangeSelector(items: ItemGraph, start, end, done?) {
    const attributes = {
        '@type': vocab('RangeSelector'),
        [oa.hasStartSelector]: start,
        [oa.hasEndSelector]: end,
    };
    return createItem(items, attributes, done);
}

function createSpecificResource(items: ItemGraph, source, rangeSelector, textQuoteSelector, done?) {
    const attributes = {
        '@type': oa.SpecificResource,
        [oa.hasSource]: source,
        [oa.hasSelector]: [rangeSelector, textQuoteSelector],
    };
    return createItem(items, attributes, done);
}

function createAnnotation(items, specificResource, ontoClass, done?) {
    const attributes = {
        '@type': oa.Annotation,
        [oa.hasBody]: [ontoClass],
        [oa.hasTarget]: specificResource,
    };
    return createItem(items, attributes, done);
}
