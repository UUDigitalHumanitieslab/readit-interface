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



/**
 * 3 example annotations
 */

// annotation 1. Note that it only points to a Body and a Target
export const anno1Instance = {
    "@id": item('100'),
    "@type": [oa.Annotation],
    [oa.hasBody]: [
        {
            "@id": readit('Content')
        },
        {
            "@id": item('200')
        }
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
    [oa.motivatedBy]: [
        {
            "@id": oa.tagging
        },
        {
            "@id": oa.identifying
        }
    ],
    [oa.hasTarget]: [
        {
            "@id": item('300')
        }
    ]
};

// the body of anno1
export const annotation1ContentInstance = {
    '@id': item('200'),
    "@type": [readit('Content')],
    [owl.sameAs]: [
        { '@id': "http://www.wikidata.org/entity/Q331656" }
    ],
    [dcterms.creator]: [
        { '@id': staff('JdeKruif') },
    ],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            '@value': "2085-12-31T04:33:16+0100"
        }
    ],
    [dcterms.title]: [
        { '@value': 'Pretty Little Title' }
    ],
};

// the target of anno1
export const anno1specificResource = {
    "@id": item('300'),
    "@type": [oa.SpecificResource],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            "@value": "2085-12-31T04:33:15+0100"
        }
    ],
    [dcterms.creator]: [
        {
            "@id": staff('JdeKruif')
        }
    ],
    [oa.hasSelector]: [
        {
            "@id": item('400')
        }
    ],
    [oa.hasSource]: [
        {
            "@id": "https://drive.google.com/drive/folders/1jJWerBVv5AMjI0SLjSDwHXH0QV9iVZpf"
        }
    ]
};

// the (Range)Selector belonging (via item('300') / specificResource) to anno1
export const anno1RangeSelector = {
    "@id": item('400'),
    "@type": [vocab('RangeSelector')],
    [oa.hasStartSelector]: [
        {
            "@id": item('500')
        }
    ],
    [oa.hasEndSelector]: [
        {
            "@id": item('501')
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
            "@id": staff('JdeKruif')
        }
    ],
}

export const anno1StartSelector = {
    "@id": item('500'),
    "@type": [oa.XPathSelector],
    [rdf.value]: [
        {
            '@value': 'substring(.//*[0]/text(), 5)'
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
            "@id": staff('JdeKruif')
        }
    ],
}

export const anno1EndSelector = {
    "@id": item('501'),
    "@type": [oa.XPathSelector],
    [rdf.value]: [
        {
            '@value': 'substring(.//*[3]/text(), 15)'
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
            "@id": staff('JdeKruif')
        }
    ],
}


// export const annotationInstance = {
//     "@id": item('1'),
//     "@type": [oa.Annotation],
//     [oa.hasBody]: [
//         {
//             "@id": readit('Content')
//         },
//         {
//             "@id": item('3')
//         }
//     ],
//     [dcterms.created]: [
//         {
//             "@type": xsd.dateTime,
//             "@value": "2085-12-31T04:33:16+0100"
//         }
//     ],
//     [dcterms.creator]: [
//         {
//             "@id": staff('JdeKruif')
//         }
//     ],
//     [oa.motivatedBy]: [
//         {
//             "@id": oa.tagging
//         },
//         {
//             "@id": oa.identifying
//         }
//     ],
//     [oa.hasTarget]: [
//         {
//             "@id": item('2')
//         }
//     ]
// };

export default [
    contentInstance,
    contentClass,
    readerClass,
    specificResource,
    textPositionSelector,
    annotationInstance,
];
// Below: two examples of selector instances

// export const textQuoteSelector = {
//     "@id": item('4'),
//     "@type": [oa.TextQuoteSelector],
//     [dcterms.created]: [
//         {
//             "@type": xsd.dateTime,
//             "@value": "2085-12-31T04:33:15+0100"
//         }
//     ],
//     [dcterms.creator]: [
//         {
//             "@id": staff('JdeKruif')
//         }
//     ],
//     [oa.exact]: [
//         {
//             "@value": "The Voyage of the Dawn Treader"
//         }
//     ],
//     [oa.prefix]: [
//         {
//             "@value": "feel, ooh, there are more things to explore, and I think one found that throughout the whole of that sequence, "
//         }
//     ],
//     [oa.suffix]: [
//         {
//             "@value": ", to discover that John Mandeville had written that this was the, the, later, to discover that these were stories that people in the Middle Ages, he was playing around with stories that already existed."
//         }
//     ]
// };

// export const textPositionSelector = {
//     "@id": item('5'),
//     "@type": [oa.TextQuoteSelector],
//     [dcterms.created]: [
//         {
//             "@type": xsd.dateTime,
//             "@value": "2085-12-31T04:33:15+0100"
//         }
//     ],
//     [dcterms.creator]: [
//         {
//             "@id": staff('JdeKruif')
//         }
//     ],
//     [oa.start]: [
//         {
//             "@value": 932,
//             "@type": xsd.nonNegativeInteger
//         }
//     ],
//     [oa.end]: [
//         {
//             "@value": 962,
//             "@type": xsd.nonNegativeInteger
//         }
//     ]
// };
