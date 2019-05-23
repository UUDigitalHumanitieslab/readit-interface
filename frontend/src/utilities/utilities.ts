import { find } from 'lodash'
import Node from '../jsonld/node';

import { skos, rdfs } from './../jsonld/ns';

export const labelKeys = [skos.prefLabel, rdfs.label, skos.altLabel];

export function getLabel(node: Node): string {
    let labelKey = find(labelKeys, key => node.has(key));
    if (labelKey) return node.get(labelKey)[0]['@value'];
}

export function getCssClassName(node: Node): string {
    let type = node.get('@type')[0]['@id'];

    if (type !== 'rdfs:Class') return null;

    let label = getLabel(node);

    if (label) {
        label = label.replace(new RegExp(' ', 'g'), '').toLowerCase();
        return `is-readit-${label}`;
    }

    return null;
}
