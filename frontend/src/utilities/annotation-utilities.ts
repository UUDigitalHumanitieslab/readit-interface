
import Node from './../jsonld/node';
import Graph from './../jsonld/graph';

import { oa, vocab, rdf } from './../jsonld/ns';
import { isType, getCssClassName as getCssClass } from './utilities';

export type AnnotationPositionDetails = {
    startNodeIndex: number;
    startCharacterIndex: number;
    endNodeIndex: number;
    endCharacterIndex: number;
}

/**
 * Get the annotation's position details (i.e. node and character indices).
 * @param annotation The node to extract the details from.
 */
export function getPositionDetails(annotation: Node): AnnotationPositionDetails {
    validateType(annotation);

    let selector = getSelector(annotation);
    let startSelector = getStartSelector(selector);
    let endSelector = getEndSelector(selector);
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
    let selector = getSelector(annotation);
    return [
        selector,
        getStartSelector(selector),
        getEndSelector(selector)
    ]
}

/**
 * Get the cssclass associated with annotation (i.e. via ontology item / category).
 * Returns be null if a value cannot be found.
 */
export function getCssClassName(annotation: Node, ontology: Graph): string {
    validateType(annotation);
    let ontologyReferences = getOntologyReferencesFromBody(annotation, ontology);
    if (ontologyReferences.length > 1) {
        throw RangeError('This oa:Annotation is associated with multiple ontology items, henceforth a cssClassName cannot be established reliably');
    }
    if (ontologyReferences.length === 1) {
        return getCssClass(ontology.get(ontologyReferences[0]));
    }
}

/**
 * Get the SpecificResource associated with this annotation.
 */
export function getSpecificResource(annotation: Node): Node {
    validateType(annotation);
    return annotation.get(oa.hasTarget)[0] as Node;
}

/**
* Get the Selector associated with the oa:Annotation annotation or its associated oa:SpecificResource.
 */
export function getSelector(node: Node): Node {
    let specificResource: Node;
    let selector = node.get(oa.hasSelector);
    if (!selector || !selector.length) {
        specificResource = getSpecificResource(node);
        selector = specificResource.get(oa.hasSelector);
    }
    return selector && selector[0] as Node;
}

/**
 * Get the StartSelector associated with an oa:Annotation or its associated oa:Selector.
 */
export function getStartSelector(node: Node): Node {
    let selector: Node;
    let startSelector = node.get(oa.hasStartSelector);
    if (!startSelector || !startSelector.length) selector = getSelector(node);
    if (selector) startSelector = selector.get(oa.hasStartSelector);
    return startSelector && startSelector[0] as Node;
}

/**
 * Get the EndSelector associated with an oa:Annotation or its associated oa:Selector.
 */
export function getEndSelector(node: Node): Node {
    let selector: Node;
    let endSelector = node.get(oa.hasEndSelector);
    if (!endSelector || !endSelector.length) selector = getSelector(node);
    if (selector) endSelector = selector.get(oa.hasEndSelector);
    return endSelector && endSelector[0] as Node;
}

/**
 * Validate if all items associated to meaningfully display an oa:Annotation
 * are present in its collection.
 * Throws TypeError with appropriate message if they are not.
 * @param annotation The oa:Annotation instance to validate.
 * @param graph The Graph instance that should contain all related items
 */
export function validateCompleteness(annotation: Node): void {
    validateType(annotation);

    let selector = getSelector(annotation);
    if (!selector || !isType(selector, vocab('RangeSelector'))) {
        throw new TypeError(getErrorMessage("Selector", selector, "vocab('RangeSelector')"));
    }

    let startSelector = getStartSelector(annotation);
    if (!startSelector || !isType(startSelector, oa.XPathSelector)) {
        throw new TypeError(getErrorMessage('StartSelector', startSelector, 'oa:XPathSelector'));
    }

    let endSelector = getEndSelector(annotation);
    if (!endSelector || !isType(endSelector, oa.XPathSelector)) {
        throw new TypeError(getErrorMessage('Endselector', endSelector, 'oa:XPathSelector'));
    }
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
 * Get the ontology items associated with the annotation (via oa:hasBody).
 */
function getOntologyReferencesFromBody(annotation: Node, ontology: Graph): Node[] {
    return annotation.get(oa.hasBody).filter(n => ontology.get(n)) as Node[];
}

/**
 * Helper function for isCompleteAnnotation that constructs error message from variable parts.
 */
function getErrorMessage(itemName: string, item?: Node, expectedType?: string): string {
    if (item) {
        return `${itemName} with id '${item.get('@id')}' should be of type ${expectedType}`;
    }
    else {
        return `${itemName} cannot be empty or undefined.`
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
