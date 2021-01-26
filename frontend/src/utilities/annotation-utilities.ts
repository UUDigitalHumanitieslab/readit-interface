import Node from '../common-rdf/node';

import { rdf, rdfs, skos, oa, schema, readit, vocab } from '../common-rdf/ns';
import { isType, getCssClassName as getCssClass, isOntologyClass } from './linked-data-utilities';

export type AnnotationPositionDetails = {
    startIndex: number;
    endIndex: number;
}

/**
 * A class that is **not** in the ontology, but which can be used as a
 * placeholder in new annotations and which can be rendered with a color.
 */
export const placeholderClass = new Node({
    '@id': readit('placeholder'),
    '@type': [rdfs.Class],
    [skos.prefLabel]: 'Selection',
    [skos.definition]: 'This annotation has not been tagged yet.',
    [schema.color]: '#accef7',
});

/**
 * Get a text that is usable as a label for an oa:Annotation,
 * from its highlight text.
 */
export function getLabelText(text: string): string {
    if (text == null) return '';
    if (text.length < 80) return text;
    return `${text.substring(0, 33)} (..) ${text.substring(text.length - 34, text.length)}`;
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
export function getTargetDetails(annotation: Node): Node[] {
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
