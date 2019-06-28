import { oa, rdf, rdfs, item, vocab, xsd, } from './../jsonld/ns';



export const annotation1 = {
    "@id": item('100'),
    "@type": [oa.Annotation],
    [oa.hasTarget]: [
        {
            "@id": item('200')
        }
    ]
}

export const annotation1RangeSelector = {
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
    [rdf.value]: `substring(.//*[0]/text(), 5)`
}

export const endSelector = {
    "@id": item('202'),
    "@type": [oa.XPathSelector],
    [rdf.value]: `substring(.//*[3]/text(), 15)`
}
