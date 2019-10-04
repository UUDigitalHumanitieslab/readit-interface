import {
    rdf,
    rdfs,
    owl,
    dcterms,
    staff,
    readit,
    item,
    source,
    vocab,
    skos,
    schema,
    xsd,
    oa,
} from '../jsonld/ns';

/**
 * 3 example annotations, all in source1
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
export const anno1ContentInstance = {
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
export const anno1SpecificResource = {
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
        },
        {
            "@id": item('700')
        }
    ],
    [oa.hasSource]: [
        {
            "@id": source('1')
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

//a TextQuoteSelector belong to anno 1
export const anno1TextQuoteSelector = {
    "@id": item('700'),
    "@type": [oa.TextQuoteSelector],
    [oa.prefix]: [
        {
            '@value': `English descriptions of reading experiences
            <br><br>
            id_19
            Titre : The Idler in France / by the countess of Blessington Auteur: `
        }
    ],
    [oa.exact]: [
        {
            "@value": `Blessington, Margaret Gardiner. Date d'édition : 1841. Droits : do-
            maine public. Provenance : Bibliothèque nationale de France.
            <br><br>
            id_19_a, p 40
            I remember reading years ago of the melancholy physiognomy of King
            Charles I, which when seen in his portrait by a Florentine sculptor, to
            whom it was sent in order that a bust should be made from it, drew forth
            the observation that the countenance indicated that its owner would come
            to a violent death.
            I was reminded of this anecdote by the face`
        }
    ],
    [oa.suffix]: [
        {
            "@value": ` of the Duchesse d'Angoulême;
            for though I do not pretend to a prescience as to her future fate, I cannot
            help arguing`
        }
    ],
}




// annotation 2.
export const anno2Instance = {
    "@id": item('101'),
    "@type": [oa.Annotation],
    [oa.hasBody]: [
        {
            "@id": readit('Medium')
        },
        {
            "@id": item('201')
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
            "@id": item('301')
        }
    ]
};

export const anno2MediumInstance = {
    '@id': item('201'),
    "@type": [readit('Medium')],
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

export const anno2SpecificResource = {
    "@id": item('301'),
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
            "@id": item('401')
        }
    ],
    [oa.hasSource]: [
        {
            "@id": source('1')
        }
    ]
};

export const anno2RangeSelector = {
    "@id": item('401'),
    "@type": [vocab('RangeSelector')],
    [oa.hasStartSelector]: [
        {
            "@id": item('502')
        }
    ],
    [oa.hasEndSelector]: [
        {
            "@id": item('503')
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

export const anno2StartSelector = {
    "@id": item('502'),
    "@type": [oa.XPathSelector],
    [rdf.value]: [
        {
            '@value': 'substring(.//*[6]/text(), 80)'
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

export const anno2EndSelector = {
    "@id": item('503'),
    "@type": [oa.XPathSelector],
    [rdf.value]: [
        {
            '@value': 'substring(.//*[6]/text(), 97)'
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

// annotation 3.
export const anno3Instance = {
    "@id": item('102'),
    "@type": [oa.Annotation],
    [oa.hasBody]: [
        {
            "@id": readit('Reader')
        },
        {
            "@id": item('202')
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
            "@id": item('302')
        }
    ]
};

export const anno3ReaderInstance = {
    '@id': item('202'),
    "@type": [readit('Reader')],
    [dcterms.creator]: [
        { '@id': staff('JdeKruif') },
    ],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            '@value': "2085-12-31T04:33:16+0100"
        }
    ],
    [readit('descriptionOf')]: [
        {
            "@id": item('600')
        }
    ],
    [readit('age')]: [
        {
            "@value": 12
        }
    ]
};

export const anno3PersonInstance = {
    '@id': item('600'),
    "@type": [readit('Person')],
    [dcterms.creator]: [
        { '@id': staff('JdeKruif') },
    ],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            '@value': "2085-12-31T04:33:16+0100"
        }
    ],
    [readit('name')]: [
        {
            "@value": "Henry Williams"
        }
    ],
    [schema.birthPlace]: [
        {
            "@value": "London"
        }
    ],
}

export const anno3SpecificResource = {
    "@id": item('302'),
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
            "@id": item('402')
        }
    ],
    [oa.hasSource]: [
        {
            "@id": source('1')
        }
    ]
};

export const anno3RangeSelector = {
    "@id": item('402'),
    "@type": [vocab('RangeSelector')],
    [oa.hasStartSelector]: [
        {
            "@id": item('504')
        }
    ],
    [oa.hasEndSelector]: [
        {
            "@id": item('505')
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

export const anno3StartSelector = {
    "@id": item('504'),
    "@type": [oa.XPathSelector],
    [rdf.value]: [
        {
            '@value': 'substring(.//*[18]/text(), 1)'
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

export const anno3EndSelector = {
    "@id": item('505'),
    "@type": [oa.XPathSelector],
    [rdf.value]: [
        {
            '@value': 'substring(.//*[18]/text(), 250)'
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
export default [
    anno1Instance,
    anno1ContentInstance,
    anno1SpecificResource,
    anno1RangeSelector,
    anno1StartSelector,
    anno1EndSelector,
    anno1TextQuoteSelector,
    anno2Instance,
    anno2MediumInstance,
    anno2SpecificResource,
    anno2RangeSelector,
    anno2StartSelector,
    anno2EndSelector,
    anno3Instance,
    anno3ReaderInstance,
    anno3SpecificResource,
    anno3RangeSelector,
    anno3StartSelector,
    anno3EndSelector,
];
