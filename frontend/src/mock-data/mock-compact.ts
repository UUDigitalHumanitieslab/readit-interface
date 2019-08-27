import {
    rdfs,
    owl,
    dcterms,
    staff,
    readit,
    item,
    skos,
    schema,
    xsd,
    oa,
} from '../jsonld/ns';
import context from './mock-context';

export const contentInstance = {
    'id': '3',
    'type': 'readit:Content',
    'sameAs': 'http://www.wikidata.org/entity/Q331656',
    'creator': 'staff:JdeKruif',
    'created': '2085-12-31T04:33:16+01:00',
    'title': 'Pretty Little Title',
};

export const contentClass = {
    'id': 'readit:Content',
    'type': 'rdfs:Class',
    'prefLabel': 'Content',
    'definition': 'Dit is de definitie van content',
    'created': '2085-12-31T04:33:16+01:00',
    'creator': 'staff:JdeKruif',
    'color': 'hotpink',
};

export const specificResource = {
    'id': '2',
    'type': 'SpecificResource',
    'created': '2085-12-31T04:33:15+01:00',
    'creator': 'staff:JdeKruif',
    'selector': '5',
    'source': 'https://drive.google.com/drive/folders/1jJWerBVv5AMjI0SLjSDwHXH0QV9iVZpf'
};

export const textQuoteSelector = {
    'id': '4',
    'type': 'TextQuoteSelector',
    'created': '2085-12-31T04:33:15+01:00',
    'creator': 'staff:JdeKruif',
    'exact': 'The Voyage of the Dawn Treader',
    'prefix': 'feel, ooh, there are more things to explore, and I think one found that throughout the whole of that sequence, ',
    'suffix': ', to discover that John Mandeville had written that this was the, the, later, to discover that these were stories that people in the Middle Ages, he was playing around with stories that already existed.'
};

export const textPositionSelector = {
    'id': '5',
    'type': 'TextQuoteSelector',
    'created': '2085-12-31T04:33:15+01:00',
    'creator': 'staff:JdeKruif',
    'start': 932,
    'end': 962
};

export const annotationInstance = {
    'id': '1',
    'type': 'Annotation',
    'body': ['readit:Content', '3'],
    'created': '2085-12-31T04:33:16+01:00',
    'creator': 'staff:JdeKruif',
    'motivation': ['tagging', 'identifying'],
    'target': '2'
};

export default {
    '@context': context,
    '@graph': [
        contentClass,
        contentInstance,
        specificResource,
        textQuoteSelector,
        textPositionSelector,
        annotationInstance,
    ],
};
