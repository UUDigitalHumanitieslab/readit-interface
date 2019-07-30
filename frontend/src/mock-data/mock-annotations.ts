import { oa, rdf, rdfs, skos } from './../jsonld/ns';

import Graph from './../jsonld/graph';
import Node from './../jsonld/node';

export function getMockAnnotationsGraph() {
    return new Graph([
        getAnnotation(100, 200, 300),
        getOntologyNode(200, 'Content'),
        getRangeSelector(300, 301, 302),
        getStartSelector(301, 0, 5),
        getEndSelector(302, 3, 15),
        getAnnotation(101, 201, 303),
        getOntologyNode(201, 'Reader'),
        getRangeSelector(303, 304, 305),
        getStartSelector(304, 3, 15),
        getEndSelector(305, 3, 25),
        getAnnotation(102, 202, 306),
        getOntologyNode(202, 'Reader'),
        getRangeSelector(306, 307, 308),
        getStartSelector(307, 30, 25),
        getEndSelector(308, 30, 80),
    ]);
}

export function getFourthAnno(): Graph {
    return new Graph([
        getAnnotation(103, 203, 309),
        getOntologyNode(203, 'Content'),
        getRangeSelector(309, 310, 311),
        getStartSelector(310, 15, 1),
        getEndSelector(311, 15, 5)
    ])
}

export function getAnnotation(itemId, bodyId, selectorId): Node {
    return new Node({
        "@id": `https://read-it.hum.uu.nl/item/${itemId}`,
        "@type": [oa.Annotation],
        [oa.hasBody]: [
            {
                "@id": `https://read-it.hum.uu.nl/item/${bodyId}`
            }
        ],
        [oa.hasTarget]: [
            {
                "@id": `https://read-it.hum.uu.nl/item/${selectorId}`
            }
        ]
    });
}

export function getOntologyNode(itemId, itemType): Node {
    return new Node({
        "@id": `https://read-it.hum.uu.nl/item/${itemId}`,
        "@type": [
            `https://read-it.hum.uu.nl/ontology/${itemType}`,
            rdfs.Class
        ],
        [skos.prefLabel]: [
            { '@value': `${itemType}` },
        ],
    });
}


export function getRangeSelector(itemId, startSelectorId, endSelectorId): Node {
    return new Node({
        "@id": `https://read-it.hum.uu.nl/item/${itemId}`,
        "@type": [
            oa.RangeSelector
        ],
        [oa.hasStartSelector]: [
            {
                "@id": `https://read-it.hum.uu.nl/item/${startSelectorId}`
            }
        ],
        [oa.hasEndSelector]: [
            {
                "@id": `https://read-it.hum.uu.nl/item/${endSelectorId}`
            }
        ]
    });
}

export function getXPathSelector(itemId, nodeIndex, characterIndex): Node {
    return new Node({
        "@id": `https://read-it.hum.uu.nl/item/${itemId}`,
        "@type": [
            oa.XPathSelector
        ],
        [rdf.value]: `substring(.//*[${nodeIndex}]/text(),${characterIndex})`
    });
}

export function getStartSelector(itemId, nodeIndex, characterIndex): Node {
    return getXPathSelector(itemId, nodeIndex, characterIndex);
}

export function getEndSelector(itemId, nodeIndex, characterIndex): Node {
    return getXPathSelector(itemId, nodeIndex, characterIndex);
}
