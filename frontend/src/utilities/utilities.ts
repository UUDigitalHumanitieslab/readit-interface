import { find } from 'lodash'
import Node from '../jsonld/node';

export const labelKeys = ['skos:prefLabel', 'rdfs:label', 'skos:altLabel'];

export function getLabel(node: Node): string {
    let labelKey = find(labelKeys, (labelKey) => {
        let label = node.get(labelKey);
        return label;
    });

    return node.get(labelKey as string);
}

export function getCssClassName(node: Node): string {
    if (node.get('@type') !== 'rdfs:Class') return null;

    let label = getLabel(node);

    if (label) {
        label = label.replace(new RegExp(' ', 'g'), '').toLowerCase();
        return `is-readit-${label}`;
    }

    return null;
}
