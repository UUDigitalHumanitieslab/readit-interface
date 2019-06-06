import { find } from 'lodash'
import Node from '../jsonld/node';

import { skos, rdfs } from './../jsonld/ns';

export const labelKeys = [skos.prefLabel, rdfs.label, skos.altLabel];

export function getLabel(node: Node): string {
    let labelKey = find(labelKeys, key => node.has(key));
    if (labelKey) return node.get(labelKey)[0]['@value'];
}

export function getCssClassName(node: Node): string {
    if (!isRdfsClass(node)) return null;

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
    if (node.get(rdfs.subClassOf) && node.get(rdfs.subClassOf).length > 0) {
        return true;
    }

    if (node.get('@type') && node.get('@type').length > 0) {
        let rdfsClass = find(node.get('@type'), type => type['@id'] == 'rdfs:Class');
        if (rdfsClass) return true;
    }

    return false;
}

/**
 * Check if a node has a certain property (i.e. namespace#term).
 * If the property's value is an empty array, it will be considered non-existent (i.e. ignored),
 * unless otherwise specified.
 * @param node The node to evaluate.
 * @param property The property (i.e. namespace#term) we're looking for.
 * @param ignoreEmpty Specify if properties that are found but that do not contain a value
 * should be ignored (i.e. are considered non-existent). Defaults to true.
 */
export function hasProperty(node: Node, property: string, ignoreEmpty: boolean = true): boolean {
    if (!node.get(property)) return false;
    if (ignoreEmpty && node.get(property).length == 0) return false;
    return true;
}
