import Node from '../jsonld/node';

export const labelKeys = ['skos:prefLabel', 'rdfs:label', 'skos:altLabel'];

export function getLabel(node: Node): string {
    for (let i = 0; i < labelKeys.length; i++) {
        let label = node.get(labelKeys[i]);

        if (label) {
            return label;
        }
    }

    return null;
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
