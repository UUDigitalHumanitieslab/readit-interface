import Node from './../jsonld/node';

export function getLabel(node: Node): string {
    let keys = ['skos:prefLabel', 'rdfs:label', 'skos:altLabel'];

    keys.forEach(key => {
        let label = node.get(keys[i]);

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
