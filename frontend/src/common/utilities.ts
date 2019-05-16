import Node from './../jsonld/node';

export function getLabel(node: Node): string {
    let keys = ['skos:prefLabel', 'rdfs:label', 'skos:altLabel'];
    
    for (let i = 0; i < keys.length - 1; i++) {
        let label = node.get(keys[i]);
        
        if (label) {
            return label; 
        }
    }

    return null;
}

export function getCssClassName(node: Node): string {
    if (node.get('@type') !== 'rdfs:Class') return; 
    
    let label = getLabel(node);
    
    if (label) {
        label = label.replace(new RegExp(' ', 'g'), '');
        return `is_readit-${label}`;
    }

    return null;
}
