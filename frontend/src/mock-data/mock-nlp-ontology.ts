import { rdfs, owl, skos, xsd, schema, nlp } from '../common-rdf/ns';

// Based on the NLP ontology that was on read-it.hum.uu.nl/nlp-ontology on
// 2021-09-28. A bunch of named_entity subclasses has been omitted.
export default [{
    '@id': nlp('content'),
    '@type': 'rdfs.Class',
}, {
    '@id': skos.definition,
    '@type': owl('AnnotationProperty'),
    [rdfs.subPropertyOf]: { '@id': rdfs.isDefinedBy },
}, {
    '@id': nlp().slice(0, -1),
    '@type': owl.Ontology,
}, {
    '@id': nlp('confidence'),
    '@type': owl.DatatypeProperty,
    [rdfs.domain]: { '@id': nlp('nlp_result') },
    [rdfs.range]: { '@id': xsd.float },
}, {
    '@id': nlp('reading_testimony'),
    '@type': owl.Class,
    [schema.color]: '#E5BF8C',
    [rdfs.subClassOf]: { '@id': nlp('nlp_result') },
}, {
    '@id': nlp('time'),
    '@type': owl.Class,
    [schema.color]: '#7EEE84',
    [rdfs.subClassOf]: { '@id': nlp('named_entity') },
    [skos.definition]: 'Times smaller than a day',
}, {
    '@id': nlp('was_detected_by_model'),
    '@type': owl.DatatypeProperty,
    [rdfs.domain]: { '@id': nlp('nlp_result') },
    [rdfs.range]: { '@id': xsd.string },
}, {
    '@id': nlp('work_of_art'),
    '@type': owl.Class,
    [schema.color]: '#C3A9F3',
    [rdfs.subClassOf]: { '@id': nlp('named_entity') },
    [skos.definition]: 'Titles of books, songs, etc.',
}, {
    '@id': nlp('nlp_result'),
    '@type': owl.Class,
    [rdfs.comment]: 'an automated annotation result',
}, {
    '@id': nlp('named_entity'),
    '@type': owl.Class,
    [rdfs.subClassOf]: { '@id': nlp('nlp_result') },
}];
