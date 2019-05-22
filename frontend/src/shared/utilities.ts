import Node from '../jsonld/node';

export const getLabel = function(node: Node): string {
    let keys = ['skos:prefLabel', 'rdfs:label', 'skos:altLabel'];

    for (let i = 0; i < keys.length - 1; i++) {
        let label = node.get(keys[i]);

        if (label) {
            return label;
        }
    }

    return null;
}

export const getCssClassName = function(node: Node): string {
    if (node.get('@type') !== 'rdfs:Class') return null;

    let label = getLabel(node);

    if (label) {
        label = label.replace(new RegExp(' ', 'g'), '').toLowerCase();
        return `is-readit-${label}`;
    }

    return null;
}
