import { find, includes } from 'lodash'
import Node from '../jsonld/node';

import { skos, rdfs } from './../jsonld/ns';

export const labelKeys = [skos.prefLabel, rdfs.label, skos.altLabel];

/**
 * Get a label from the node.
 */
export function getLabel(node: Node): string {
    let labelKey = find(labelKeys, key => node.has(key));
    if (labelKey) return node.get(labelKey)[0] as string;
    return getLabelFromId(node.get('@id'));
}

/**
 * Extract a label for an item or from a property name.
 * @param id the string representing the id of a linked data item.
 */
export function getLabelFromId(id: string) {
    let result;
    let index = id.lastIndexOf("#");
    if (index === -1) index = id.lastIndexOf("/");
    if (index) result = id.substring(index + 1);
    // if result is a number we're dealing with an item
    if (result && !isNaN(result)) return;
    return result;
}

/**
 * Create a css class name based on the node's label.
 * Returns null if no label is found.
 */
export function getCssClassName(node: Node): string {
    let label = getLabel(node);

    if (label) {
        label = label.replace(new RegExp(' ', 'g'), '').toLowerCase();
        return `is-readit-${label}`;
    }

    return null;
}

/**
 * Check if a node is a rdfs:Class, i.e. has rdfs:Class as (one of its) type(s) or
 * has a non-empty rdfs:subClassOf property.
 * @param node The node to evaluate
 */
export function isRdfsClass(node: Node): boolean {
    const subclass = node.get(rdfs.subClassOf);
    if (subclass && subclass.length > 0) {
        return true;
    }

    const nodeType = node.get('@type');
    if (nodeType && nodeType.length > 0) {
        return includes(nodeType, rdfs.Class);
    }

    return false;
}

/**
 * Check if a node has a certain property (i.e. namespace#term).
 * If the property's value is an empty array, it will be considered non-existent (i.e. ignored),
 * unless otherwise specified.
 * @param node The node to evaluate.
 * @param property The property (i.e. namespace#term) we're looking for.
 */
export function hasProperty(node: Node, property: string): boolean {
    if (!node.get(property)) return false;
    if (node.get(property).length == 0) return false;
    return true;
}

/**
 * Check if a Node is of a specific type.
 * TODO: strictly speaking, the type of a Node could be a subtype of the provided type,
 * making the Node an instance of that type as well. Implement a way to deal with this.
 * @param node The node to inspect.
 * @param type The expected type, e.g. (schema.CreativeWork).
 */
export function isType(node: Node, type: string) {
    return includes(node.get('@type'), type);
}


/**
 * Get the scroll top for a 'scrollTo' element that needs to scrolled to within a scrollable element.
 * Will position scrollTo at the top of the scrollable if scrollTo is heigher than scrollable, and center
 * it vertically otherwise.
 * @param scrollableEl The element that is scrollable, i.e. has overflow-y: scroll (or similar)
 * @param scrollToTop The top of the scrollTo element.
 * @param scrollToHeight The height of the scrollTo element.
 */
export function getScrollTop(scrollableEl: JQuery<HTMLElement>, scrollToTop: number, scrollToHeight: number) {
    if (scrollToHeight >= scrollableEl.height()) {
        // show start at the top
        return scrollToTop - scrollableEl.offset().top;
    }
    else {
        // center it
        let centerOffset = (scrollableEl.height() - scrollToHeight) / 2
        return scrollToTop - scrollableEl.offset().top - centerOffset;
    }
}
