import { oa, rdf, rdfs, item, vocab, xsd, } from './../jsonld/ns';

export const annotation = {
    "@id": item('100'),
    "@type": [oa.Annotation],
    [oa.hasTarget]: [
        {
            "@id": item('200')
        }
    ]
}

export const readitSelector = {
    "@id": vocab('Selector'),
    "@type": [rdfs.Class],
    [rdfs.subClassOf]: oa.Selector,
}

export const readitRangeSelector = {
    "@id": vocab('RangeSelector'),
    "@type": [rdfs.Class],
    [rdfs.subClassOf]: oa.RangeSelector,
}

export const readitRangeSelectorInstance = {
    "@id": item("200"),
    "@type": [vocab('RangeSelector')],
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

export const hasStartSelector = {
    "@id": oa.hasStartSelector,
    "@type": [rdf.Property],
    "range": oa.XPathSelector,
    "domain": vocab('RangeSelector'),
}

export const hasEndSelector = {
    "@id": oa.hasEndSelector,
    "@type": [rdf.Property],
    "range": oa.XPathSelector,
    "domain": vocab('RangeSelector'),
}

export const rangeSelector = {
    "@id": item('200'),
    "@type": [oa.RangeSelector],
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
    "@type": [oa.XPathSelector],
    [rdf.value]: `substring(.//*[0]/text(), 2)`
}

export const endSelector = {
    "@id": item('202'),
    "@type": [oa.XPathSelector],
    [rdf.value]: `substring(.//*[0]/text(), 8)`
}

// This has the start of a selector specific
// to the 4 values we would need
// export const readitNodeIndex = {
//     "@id": vocab('nodeIndex'),
//     "@type": rdf.Property,
//     "domain": vocab('Selector'),
//     "range": xsd.integer,
// }

// export const myInstance = {
//     "@id": item('666'),
//     "@type": vocab('Selector'),
//     [vocab('nodeIndex')]: 3
// }
