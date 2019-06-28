import {
    rdf,
    rdfs,
    owl,
    dcterms,
    staff,
    readit,
    item,
    vocab,
    skos,
    schema,
    xsd,
    oa,
} from '../jsonld/ns';

// This is the class definition of our RangeSelector
export const readitRangeSelectorClass = {
    "@id": vocab('RangeSelector'),
    "@type": [rdfs.Class],
    [rdfs.subClassOf]: [
        {
            '@id': oa.RangeSelector
        }
    ],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            "@value": "2085-12-31T04:33:15+0100"
        }
    ],
    [dcterms.creator]: [
        {
            "@id": staff('AHebing')
        }
    ],
}

// This is a Property definition for the relation between our RangeSelector and its StartSelector
// Note that it specifies that the StartSelector should be an XPathSelector.
export const hasStartSelectorProperty = {
    "@id": oa.hasStartSelector,
    "@type": [rdf.Property],
    "range": oa.XPathSelector,
    "domain": vocab('RangeSelector'),
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            "@value": "2085-12-31T04:33:15+0100"
        }
    ],
    [dcterms.creator]: [
        {
            "@id": staff('AHebing')
        }
    ],
}

// This is a Property definition for the relation between our RangeSelector and its EndSelector
// Note that it specifies that the EndSelector should be an XPathSelector.
export const hasEndSelectorProperty = {
    "@id": oa.hasEndSelector,
    "@type": [rdf.Property],
    "range": [
        {
            '@id': oa.XPathSelector,
        }
    ],
    "domain": [
        {
            '@id': vocab('RangeSelector'),
        }
    ],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            "@value": "2085-12-31T04:33:15+0100"
        }
    ],
    [dcterms.creator]: [
        {
            "@id": staff('AHebing')
        }
    ],
}

export default [
    readitRangeSelectorClass,
    hasStartSelectorProperty,
    hasEndSelectorProperty,
]
