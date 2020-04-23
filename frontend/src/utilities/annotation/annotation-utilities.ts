import Node from '../../jsonld/node';

import { oa, rdf, vocab } from '../../jsonld/ns';
import { isType, getCssClassName as getCssClass, isOntologyClass } from '../utilities';

export type AnnotationPositionDetails = {
    startIndex: number;
    endIndex: number;
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
 * Get a selector's position details (i.e. node and character indices).
 * @param selector The node to extract the details from.
 */
export function getPositionDetails(selector: Node): AnnotationPositionDetails {
    return {
        startIndex: selector.get(oa.start)[0] as number,
        endIndex: selector.get(oa.end)[0] as number,
    };
}

/**
 * Get an array of the items linked to the annotation that should be included
 * when deleting or adding the annotation from/to a Graph. Will not include the
 * annotation itself.
 */
export function getLinkedItems(annotation: Node): Node[] {
    validateType(annotation);
    let specificResource = getSpecificResource(annotation);
    let textQuoteSelector = getSelector(annotation, oa.TextQuoteSelector);
    let positionSelector = getSelector(annotation, oa.TextPositionSelector);

    let items = [specificResource];
    if (textQuoteSelector) items.push(textQuoteSelector);
    if (positionSelector) items.push(positionSelector);
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
* Get a Selector of a certain type from an the oa:Annotation, or from its associated oa:SpecificResource.
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

/**
 * Get a Selector of a certain type from a Node instance
 * (note that the Node should have an oa.hasSelector, so typically an oa.SpecificResource)
 */
function getSelectorByType(node: Node, selectorType: string): Node {
    let selector;
    let selectors = node.get(oa.hasSelector);
    if (selectors) selector = selectors.find((s: Node) => isType(s, selectorType));
    return selector;
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
