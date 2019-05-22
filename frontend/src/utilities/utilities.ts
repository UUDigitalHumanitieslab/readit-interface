import Node from '../jsonld/node';

export const labelKeys = ['skos:prefLabel', 'rdfs:label', 'skos:altLabel'];

export function getLabel(node: Node): string {
    for (let i = 0; i < labelKeys.length; i++) {
        if (node.attributes[labelKeys[i]]) {
            return node.attributes[labelKeys[i]][0]['@value'];
        }
    }

    return null;
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
