import {
    rdf,
    rdfs,
    xsd,
    owl,
    skos,
    frbr,
    oa,
    as,
    dc,
    dcterms,
    dctypes,
    foaf,
    schema,
} from './ns';

describe('the jsonld/ns module', function() {
    it('exports vocabulary objects which actually work', function() {
        expect(rdf()).toBe('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
        expect(rdf.type).toBe('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
        expect(rdfs()).toBe('http://www.w3.org/2000/01/rdf-schema#');
        expect(rdfs.Class).toBe('http://www.w3.org/2000/01/rdf-schema#Class');
        expect(xsd()).toBe('http://www.w3.org/2001/XMLSchema#');
        expect(xsd.dateTime).toBe('http://www.w3.org/2001/XMLSchema#dateTime');
        expect(owl()).toBe('http://www.w3.org/2002/07/owl#');
        expect(owl.sameAs).toBe('http://www.w3.org/2002/07/owl#sameAs');
        expect(skos()).toBe('http://www.w3.org/2004/02/skos/core#');
        expect(skos.prefLabel).toBe('http://www.w3.org/2004/02/skos/core#prefLabel');
        expect(frbr()).toBe('http://purl.org/vocab/frbr/core#');
        expect(frbr.Manifestation).toBe('http://purl.org/vocab/frbr/core#Manifestation');
        expect(oa()).toBe('http://www.w3.org/ns/oa#');
        expect(oa.Annotation).toBe('http://www.w3.org/ns/oa#Annotation');
        expect(as()).toBe('http://www.w3.org/ns/activitystreams#');
        expect(as.OrderedCollection).toBe('http://www.w3.org/ns/activitystreams#OrderedCollection');
        expect(dc()).toBe('http://purl.org/dc/elements/1.1/');
        expect(dc.format).toBe('http://purl.org/dc/elements/1.1/format');
        expect(dcterms()).toBe('http://purl.org/dc/terms/');
        expect(dcterms.creator).toBe('http://purl.org/dc/terms/creator');
        expect(dctypes()).toBe('http://purl.org/dc/dcmitype/');
        expect(dctypes.Text).toBe('http://purl.org/dc/dcmitype/Text');
        expect(foaf()).toBe('http://xmlns.com/foaf/0.1/');
        expect(foaf.knows).toBe('http://xmlns.com/foaf/0.1/knows');
        expect(schema()).toBe('http://schema.org/');
        expect(schema.audience).toBe('http://schema.org/audience');
    });
});
