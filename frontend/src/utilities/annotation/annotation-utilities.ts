import Node from '../../jsonld/node';

import { oa, rdf, vocab } from '../../jsonld/ns';
import { isType, getCssClassName as getCssClass, isOntologyClass } from '../utilities';

export type AnnotationPositionDetails = {
    startNodeIndex: number;
    startCharacterIndex: number;
    endNodeIndex: number;
    endCharacterIndex: number;
}

/**
 * Get a text that is usable as a label for an oa:Annotation,
 * from its oa:TextQuoteSelector.
 */
export function getLabelText(selector: Node): string {
    if (!isType(selector, oa.TextQuoteSelector))
        throw TypeError('selector should be an oa:TextQuoteSelector');
    if (!selector.has(oa.exact)) return;

    let exact = selector.get(oa.exact)[0] as string;
    if (exact.length < 80) return exact;
    return `${exact.substring(0, 33)} (..) ${exact.substring(exact.length - 34, exact.length)}`;
}

/**
 * Get the annotation's position details (i.e. node and character indices).
 * @param annotation The node to extract the details from.
 */
export function getPositionDetails(startSelector: Node, endSelector: Node): AnnotationPositionDetails {
    return {
        startNodeIndex: getNodeIndex(startSelector),
        startCharacterIndex: getCharacterIndex(startSelector),
        endNodeIndex: getNodeIndex(endSelector),
        endCharacterIndex: getCharacterIndex(endSelector)
    }
}

/**
 * Get an array of the items linked to the annotation that should be included when deleting or adding
 * the annotation from/to a Graph. Will not include the annotation itself.
 */
export function getLinkedItems(annotation: Node): Node[] {
    validateType(annotation);
    let specificResource = getSpecificResource(annotation);
    let rangeSelector = getSelector(annotation, vocab('RangeSelector'));
    let textQuoteSelector = getSelector(annotation, oa.TextQuoteSelector);

    let items = [
        specificResource,
        rangeSelector,
        getStartSelector(rangeSelector),
        getEndSelector(rangeSelector)
    ]
    if (textQuoteSelector) items.push(textQuoteSelector);
    return items;
}

/**
 * Get the cssclass associated with annotation (i.e. via ontology class in body).
 * Returns be null if a value cannot be found.
 */
export function getCssClassName(annotation: Node): string {
    validateType(annotation);
    return getCssClass(getOntologyClassFromBody(annotation));
}

/**
 * Get the SpecificResource associated with this annotation.
 */
export function getSpecificResource(annotation: Node): Node {
    validateType(annotation);
    return annotation.get(oa.hasTarget)[0] as Node;
}

/**
* Get the a type of Selector associated an the oa:Annotation, or with its associated oa:SpecificResource.
 */
export function getSelector(node: Node, selectorType: string): Node {
    let specificResource: Node;
    let selector = getSelectorByType(node, selectorType);
    if (!selector) {
        specificResource = getSpecificResource(node);
        selector = getSelectorByType(specificResource, selectorType);
    }
    return selector;
}

function getSelectorByType(node: Node, selectorType: string): Node {
    let selector;
    let selectors = node.get(oa.hasSelector);
    if (selectors) selector = selectors.find((s: Node) => isType(s, selectorType));
    return selector;
}

/**
 * Get the StartSelector associated with an oa:Annotation or its associated oa:Selector.
 */
export function getStartSelector(node: Node): Node {
    let selector: Node;
    let startSelector = node.get(oa.hasStartSelector);
    if (!startSelector || !startSelector.length) selector = getSelector(node, vocab('RangeSelector'));
    if (selector) startSelector = selector.get(oa.hasStartSelector);
    return startSelector && startSelector[0] as Node;
}

/**
 * Get the EndSelector associated with an oa:Annotation or its associated oa:Selector.
 */
export function getEndSelector(node: Node): Node {
    let selector: Node;
    let endSelector = node.get(oa.hasEndSelector);
    if (!endSelector || !endSelector.length) selector = getSelector(node, vocab('RangeSelector'));
    if (selector) endSelector = selector.get(oa.hasEndSelector);
    return endSelector && endSelector[0] as Node;
}

/**
 * Get the oa:hasSource associated with an oa:Annotation or its associated oa:SpecificResource.
 */
export function getSource(node: Node): Node {
    let specificResource: Node;
    let source = node.get(oa.hasSource);
    if (!source || !source.length) {
        specificResource = getSpecificResource(node);
        source = specificResource.get(oa.hasSource);
    }
    return source && source[0] as Node;
}

/**
 * Get the ontology class (not the instances of such classes!) from the annotation's body.
 * Will return ths first one if multiple are found.
 */
function getOntologyClassFromBody(annotation: Node): Node {
    let ontologyClass = annotation.get(oa.hasBody).filter(b => isOntologyClass(b as Node)) as Node[];
    return ontologyClass && ontologyClass[0];
}

/**
 * Verify that the node is an instance of oa:Annotation.
 */
function validateType(annotation: Node): void {
    if (!isType(annotation, oa.Annotation)) {
        throw new TypeError(
            `Node ${annotation.get('@id')} is not an instance of oa:Annotation`);
    }
}


/**
 * Get the node index from an XPathSelector
 * @param selector XPathSelector with a rdf:Value like 'substring(.//*[${nodeIndex}]/text(),${characterIndex})'
 */
function getNodeIndex(selector: Node): number {
    let xpath = <string>selector.get(rdf.value)[0];
    let index = xpath.indexOf('[') + 1;
    let endIndex = xpath.indexOf(']');
    return +xpath.substring(index, endIndex);
}

/**
 * Get the character index from an XPathSelector
 * @param selector XPathSelector with a rdf:Value like 'substring(.//*[${nodeIndex}]/text(),${characterIndex})'
 */
function getCharacterIndex(selector: Node): number {
    let xpath = <string>selector.get(rdf.value)[0];
    let startIndex = xpath.indexOf(',') + 1;
    let endIndex = xpath.length - 1;
    return +xpath.substring(startIndex, endIndex);
}
