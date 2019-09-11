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
 * 5 example annotations, 3 overlapping, all in source1
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
        }
    ],
    [oa.hasSource]: [
        {
            "@id": item('1')
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
            "@id": item('1')
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
            "@id": item('1')
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
            '@value': 'substring(.//*[3]/text(), 70)'
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
            '@value': 'substring(.//*[3]/text(), 150)'
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

// First overlapping anno
export const anno4Instance = {
    "@id": item('103'),
    "@type": [oa.Annotation],
    [oa.hasBody]: [
        {
            "@id": readit('Content')
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
            "@id": item('303')
        }
    ]
};

export const anno4ContentInstance = {
    '@id': item('201'),
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

export const anno4SpecificResource = {
    "@id": item('303'),
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
            "@id": item('403')
        }
    ],
    [oa.hasSource]: [
        {
            "@id": item('1')
        }
    ]
};

export const anno4RangeSelector = {
    "@id": item('403'),
    "@type": [vocab('RangeSelector')],
    [oa.hasStartSelector]: [
        {
            "@id": item('506')
        }
    ],
    [oa.hasEndSelector]: [
        {
            "@id": item('507')
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

export const anno4StartSelector = {
    "@id": item('506'),
    "@type": [oa.XPathSelector],
    [rdf.value]: [
        {
            '@value': 'substring(.//*[3]/text(), 20)'
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

export const anno4EndSelector = {
    "@id": item('507'),
    "@type": [oa.XPathSelector],
    [rdf.value]: [
        {
            '@value': 'substring(.//*[3]/text(), 75)'
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


// annotation 5.
export const anno5Instance = {
    "@id": item('104'),
    "@type": [oa.Annotation],
    [oa.hasBody]: [
        {
            "@id": readit('Medium')
        },
        {
            "@id": item('203')
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
            "@id": item('304')
        }
    ]
};

export const anno5MediumInstance = {
    '@id': item('203'),
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

export const anno5SpecificResource = {
    "@id": item('304'),
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
            "@id": item('404')
        }
    ],
    [oa.hasSource]: [
        {
            "@id": item('1')
        }
    ]
};

export const anno5RangeSelector = {
    "@id": item('404'),
    "@type": [vocab('RangeSelector')],
    [oa.hasStartSelector]: [
        {
            "@id": item('508')
        }
    ],
    [oa.hasEndSelector]: [
        {
            "@id": item('509')
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

export const anno5StartSelector = {
    "@id": item('508'),
    "@type": [oa.XPathSelector],
    [rdf.value]: [
        {
            '@value': 'substring(.//*[3]/text(), 45)'
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

export const anno5EndSelector = {
    "@id": item('509'),
    "@type": [oa.XPathSelector],
    [rdf.value]: [
        {
            '@value': 'substring(.//*[6]/text(), 345)'
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
    anno4Instance,
    anno4ContentInstance,
    anno4SpecificResource,
    anno4RangeSelector,
    anno4StartSelector,
    anno4EndSelector,
    anno5Instance,
    anno5MediumInstance,
    anno5SpecificResource,
    anno5RangeSelector,
    anno5StartSelector,
    anno5EndSelector,
];
