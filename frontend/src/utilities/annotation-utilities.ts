
import Node from './../jsonld/node';

import { oa, vocab, rdf } from './../jsonld/ns';
import { isType, getCssClassName as getCssClass } from './utilities';
import ontology from './../global/readit-ontology';

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

    let startSelector = getStartSelector(annotation);
    let endSelector = getEndSelector(annotation);
    return {
        startNodeIndex: getNodeIndex(startSelector),
        startCharacterIndex: getCharacterIndex(startSelector),
        endNodeIndex: getNodeIndex(endSelector),
        endCharacterIndex: getCharacterIndex(endSelector)
    }
}

/**
 * Get an array of items linked to the annotation. Will not include the annotation itself.
 * These items should all included when deleting or adding the annotation from or to a Graph.
 */
export function getLinkedItems(annotation: Node): Node[] {
    validateType(annotation);
    return [
        getSpecificResource(annotation),
        getSelector(annotation),
        getStartSelector(annotation),
        getEndSelector(annotation)
    ]
}

/**
 * Get the cssclass associated with annotation (i.e. via ontology item / category).
 * Returns be null if a value cannot be found.
 */
export function getCssClassName(annotation: Node): string {
    validateType(annotation);
    let ontologyReferences = getOntologyReferencesFromBody(annotation);
    if (ontologyReferences.length > 1) {
        throw RangeError('An oa:Annotation cannot be associated with more than one ontology item');
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
    return <Node>annotation.get(oa.hasTarget)[0];
}

/**
* Get the Selector associated with this annotation.
 */
export function getSelector(annotation: Node): Node {
    validateType(annotation);
    let specificResource = getSpecificResource(annotation);
    return <Node>specificResource.get(oa.hasSelector)[0];
}

/**
 * Get the StartSelector associated with this annotation.
 */
export function getStartSelector(annotation: Node): Node {
    validateType(annotation);
    let selector = getSelector(annotation);
    return <Node>selector.get(oa.hasStartSelector)[0];
}

/**
 * Get the EndSelector associated with this annotation.
 */
export function getEndSelector(annotation: Node): Node {
    validateType(annotation);
    let selector = getSelector(annotation);
    return <Node>selector.get(oa.hasEndSelector)[0];
}

/**
 * Validate if all related items required by a oa:Annotation instance are in its collection.
 * Throws TypeError with appropriate message if they are not.
 * @param annotation The oa:Annotation instance to validate.
 * @param graph The Graph instance that should contain all related items
 */
export function validateCompleteness(annotation: Node): void {
    validateType(annotation);

    if (getOntologyReferencesFromBody(annotation).length < 1) {
        throw new TypeError(
            `The oa:hasBody property of annotation ${annotation.get('@id')} is empty or the related ontology item cannot be found`);
    }

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
function getOntologyReferencesFromBody(annotation: Node): Node[] {
    return <Node[]> annotation.get(oa.hasBody).filter(n => ontology.get(n));
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
