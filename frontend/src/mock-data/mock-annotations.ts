import { oa, rdf, item } from './../jsonld/ns';

export const annotation = {
    "@id": item('100'),
    "@type": [oa.Annotation],
    [oa.hasTarget]: [
        {
            "@id": item('200')
        }
    ]
}

export const rangeSelector = {
    "@id": item('200'),
    "@type": [
        oa.RangeSelector
    ],
    [oa.hasStartSelector]: [
        {
            "@id": item('201')
        }
    ],
    [oa.hasEndSelector]: [
        {
            "@id": item('202')
        }
    ]
}

export const startSelector = {
    "@id": item('201'),
    "@type": [
        oa.XPathSelector
    ],
    [rdf.value]: `substring(.//*[0]/text(), 2)`
}

export const endSelector = {
    "@id": item('202'),
    "@type": [
        oa.XPathSelector
    ],
    [rdf.value]: `substring(.//*[0]/text(), 8)`
}
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
