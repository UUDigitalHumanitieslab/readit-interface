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


/**
 * Some read-it specific classes and properties, e.g. the categories used to annotate
 * and the RangeSelector (incl properties).
 */

export const contentClass = {
    "@id": readit('Content'),
    "@type": [rdfs.Class],
    [skos.prefLabel]: [
        { '@value': 'Content' },
    ],
    [skos.definition]: [
        { '@value': 'Dit is de definitie van content' },
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
        { '@value': 'orange' }
    ],
};

export const readerClass = {
    "@id": readit('Reader'),
    "@type": [rdfs.Class],
    [skos.prefLabel]: [
        { '@value': 'Reader' },
    ],
    [skos.definition]: [
        { '@value': 'Dit is de definitie van reader' },
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
        { '@value': 'green' }
    ],
};

export const mediumClass = {
    "@id": readit('Medium'),
    "@type": [rdfs.Class],
    [skos.prefLabel]: [
        { '@value': 'Medium' },
    ],
    [skos.definition]: [
        { '@value': 'Dit is de definitie van medium' },
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
        { '@value': 'lightcoral' }
    ],
};

export default [
    contentClass,
    mediumClass,
    readerClass,
]
