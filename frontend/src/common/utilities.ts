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
