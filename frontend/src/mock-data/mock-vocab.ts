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

// class definition for a Source
export const sourceClass = {
    "@id": vocab('Source'),
    "@type": [rdfs.Class],
    [rdfs.subClassOf]: [
        {
            '@id': schema.CreativeWork
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
    [skos.prefLabel]: [
        { '@value': 'Source' },
    ],
    [skos.definition]: [
        { '@value': 'Dit is de definitie van source' },
    ],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            "@value": "2085-12-31T04:33:16+0100"
        }
    ],
    [dcterms.creator]: [
        {
            "@id": staff('JdeKruif')
        }
    ],
    [schema.color]: [
        { '@value': 'hotpink' }
    ],
}

// This is the class definition of our RangeSelector.
// It is obsolete, but we are not removing the mock yet because the definition
// is also still present in the backend.
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
    [rdfs.range]: oa.XPathSelector,
    [rdfs.domain]: vocab('RangeSelector'),
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
    [rdfs.range]: [
        {
            '@id': oa.XPathSelector,
        }
    ],
    [rdfs.domain]: [
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
