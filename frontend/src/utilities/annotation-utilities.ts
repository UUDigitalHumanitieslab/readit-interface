
import Node from './../jsonld/node';
import Graph from './../jsonld/graph';

import { oa, vocab, } from './../jsonld/ns';
import { isType } from './utilities';
import ontology from './../global/readit-ontology';


/**
 * Get the SpecificResource associated with this annotation.
 */
export function getSpecificResource(annotation: Node) {
    return annotation.get(oa.hasTarget)[0];
}

/**
* Get the Selector associated with this annotation.
 */
export function getSelector(annotation: Node) {
    let specificResource = getSpecificResource(annotation);
    return specificResource.get(oa.hasSelector)[0];
}

/**
 * Get the StartSelector associated with this annotation.
 */
export function getStartSelector(annotation: Node) {
    let selector = getSelector(annotation);
    return selector.get(oa.hasStartSelector)[0];
}

/**
 * Get the EndSelector associated with this annotation.
 */
export function getEndSelector(annotation: Node) {
    let selector = getSelector(annotation);
    return selector.get(oa.hasEndSelector)[0];
}

/**
 * Verify that the node is an instance of oa:Annotation.
 */
export function isAnnotationInstance(annotation: Node) {
    return isType(annotation, oa.Annotation);
}

/**
 * Validate if all related items required by a oa:Annotation instance are in a Graph.
 * Throws TypeError with appropriate message if they are not.
 * @param annotation The oa:Annotation instance to validate.
 * @param graph The Graph instance that should contain all related items
 */
export function isCompleteAnnotation(annotation: Node): boolean {
    if (!isAnnotationInstance(annotation)) {
        throw new TypeError(
            `Node ${annotation.get('@id')} is not an instance of oa:Annotation`);
    }

    if (annotation.get(oa.hasBody).filter(n => ontology.get(n)).length < 1) {
        throw new TypeError(
            `The oa:hasBody property of annotation ${annotation.get('@id')} is empty or the related ontology item cannot be found`);
    }

    let selector = getSelector(annotation);
    if (!selector || !isType(selector, vocab('RangeSelector'))) {
        throw new TypeError(getErrorMessage("Selector", selector, "vocab('RangeSelector')"));
    }

    let startSelector = selector.get(oa.hasStartSelector)[0];
    if (!startSelector || !isType(startSelector, oa.XPathSelector)) {
        throw new TypeError(getErrorMessage('StartSelector', startSelector, 'oa:XPathSelector'));
    }

    let endSelector = selector.get(oa.hasEndSelector)[0];
    if (!endSelector || !isType(endSelector, oa.XPathSelector)) {
        throw new TypeError(getErrorMessage('Endselector', endSelector, 'oa:XPathSelector'));
    }

    return true;
}

/**
 * Helper function for isCompleteAnnotation that constructs error message from variable parts.
 */
function getErrorMessage(itemName: string, item?: Node, expectedType?: string) {
    if (item) {
        return `${itemName} with id '${item.get('@id')}' should be of type ${expectedType}`;
    }
    else {
        return `${itemName} cannot be empty or undefined.`
    }
}
