import { find } from 'lodash'
import Node from '../jsonld/node';

export const labelKeys = ['skos:prefLabel', 'rdfs:label', 'skos:altLabel'];

export function getLabel(node: Node): string {
    let labelKey = find(labelKeys, key => node.has(key));
    return node.get(labelKey as string)[0]['@value'];
}

export function getCssClassName(node: Node): string {
    let type = node.attributes['@type'][0]['@id'];
    if (type !== 'rdfs:Class') return null;

    let label = getLabel(node);

    if (label) {
        label = label.replace(new RegExp(' ', 'g'), '').toLowerCase();
        return `is-readit-${label}`;
    }

    return null;
}
