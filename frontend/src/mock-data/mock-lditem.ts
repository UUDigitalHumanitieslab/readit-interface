import Node from './../jsonld/node';
import { JsonLdObject } from './../jsonld/json';

let attributes: JsonLdObject = {
    '@id': 'uniqueID',
    'http://www.w3.org/2004/02/skos/core#prefLabel': [
        { '@value': 'Content' },
    ],
    "@type": [
        "http://www.w3.org/2000/01/rdf-schema#rdfs:Class"
    ],
    "http://www.w3.org/2002/07/owl#sameAs": [
        { '@id': "http://www.wikidata.org/entity/Q331656" }
    ],
    "creator": [
        { '@id': "staff:JdeKruif" },
    ],
    "created": [
        { '@value': "2085-12-31T04:33:16+0100" }
    ],
    "readit:Title": [
        { '@value': 'Pretty Little Title' }
    ],
    'http://www.w3.org/2004/02/skos/core#definition': [
        { '@value': 'Dit is de definitie van content' },
    ],
    'http://schema.org/color': [
        { '@value': 'hotpink' }
    ],
}

var lditem = new Node(attributes);

export default lditem;
