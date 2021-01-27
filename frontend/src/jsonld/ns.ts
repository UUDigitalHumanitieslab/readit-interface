import { nsRoot } from 'config.json';
import Vocabulary from './vocabulary';

/**
 * Definitions of standard vocabularies. Terms listed in this module
 * can be relied upon to be defined and may be hardcoded as follows:

      import { rdfs } from '../jsonld/ns';

      let someNode = ...;  // imagine some instance of Node here
      let theLabels = someNode.get(rdfs.label);

 * Note to users: this module is NOT a comprehensive listing of all
 * available terms in each vocabulary. Refer to the official
 * documentation instead. Links to official documentation are
 * provided for each vocabulary. Missing terms and entire
 * vocabularies can be added to this module as needed.
 *
 * Note to editors: please keep the array of terms for each namespace
 * in ascending alphabetical order. This makes it easier to check
 * whether a term is already present.
 */

/**
 * RDF Schema 1.1
 * https://www.w3.org/TR/2014/REC-rdf-schema-20140225/
 * For historical reasons, this vocabulary has two namespaces,
 * commonly abbreviated as 'rdf' and 'rdfs'.
 */

export const rdfPrefix = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
export const rdfsPrefix = 'http://www.w3.org/2000/01/rdf-schema#';

export const rdfTerms = [
    'Alt',
    'Bag',
    'first',
    'HTML',
    'langString',
    'List',
    'nil',
    'object',
    'predicate',
    'Property',
    'rest',
    'Seq',
    'Statement',
    'subject',
    'type',
    'value',
    'XMLLiteral',
] as const;

export const rdfsTerms = [
    'Class',
    'comment',
    'ConainerMembershipProperty',
    'Container',
    'Datatype',
    'domain',
    'isDefinedBy',
    'label',
    'Literal',
    'member',
    'range',
    'Resource',
    'seeAlso',
    'subClassOf',
    'subPropertyOf',
] as const;

export const rdf = Vocabulary(rdfPrefix, rdfTerms);
export const rdfs = Vocabulary(rdfsPrefix, rdfsTerms);

/**
 * XML Schema Definition Language 1.1
 * https://www.w3.org/TR/2012/REC-xmlschema11-2-20120405/
 */

export const xsdPrefix = 'http://www.w3.org/2001/XMLSchema#';

export const xsdTerms = [
    'anyAtomicType',
    'anySimpleType',
    'anyType',
    'anyURI',
    'base64Binary',
    'boolean',
    'date',
    'dateTime',
    'dateTimeStamp',
    'decimal',
    'double',
    'duration',
    'ENTITY',
    'float',
    'hexBinary',
    'ID',
    'IDREF',
    'integer',
    'nonNegativeInteger',
    'NOTATION',
    'QName',
    'string',
    'time',
] as const;

export const xsd = Vocabulary(xsdPrefix, xsdTerms);

/**
 * OWL 2 Web Ontology Language
 * https://www.w3.org/TR/2012/REC-owl2-overview-20121211/
 */

export const owlPrefix = 'http://www.w3.org/2002/07/owl#';

export const owlTerms = [
    'AllDisjointClasses',
    'allValuesFrom',
    'annotatedProperty',
    'annotatedSource',
    'annotatedTarget',
    'assertionProperty',
    'AsymmetricProperty',
    'Axiom',
    'cardinality',
    'complementOf',
    'datatypeComplementOf',
    'DatatypeProperty',
    'differentFrom',
    'equivalentClass',
    'equivalentProperty',
    'FunctionalProperty',
    'hasKey',
    'hasSelf',
    'hasValue',
    'imports',
    'intersectionOf',
    'InverseFunctionalProperty',
    'inverseOf',
    'IrreflexiveProperty',
    'maxQualifiedCardinality',
    'members',
    'minQualifiedCardinality',
    'NamedIndividual',
    'NegativePropertyAssertion',
    'ObjectProperty',
    'onClass',
    'onDatatype',
    'oneOf',
    'onProperty',
    'Ontology',
    'propertyChainAxiom',
    'propertyDisjointWith',
    'qualifiedCardinality',
    'ReflexiveProperty',
    'Restriction',
    'sameAs',
    'someValuesFrom',
    'sourceIndividual',
    'subClassOf',
    'SymmetricProperty',
    'targetIndividual',
    'targetValue',
    'Thing',
    'TransitiveProperty',
    'unionOf',
    'withRestrictions',
] as const;

export const owl = Vocabulary(owlPrefix, owlTerms);

/**
 * Simple Knowledge Organization System (SKOS)
 * https://www.w3.org/TR/2009/REC-skos-reference-20090818/
 * We use this as a supplement to OWL. For some caveats, see
 * https://www.w3.org/TR/2009/NOTE-skos-primer-20090818/#secskosowl.
 */

export const skosPrefix = 'http://www.w3.org/2004/02/skos/core#';

export const skosTerms = [
    'altLabel',
    'broader',
    'changeNote',
    'definition',
    'editorialNote',
    'example',
    'hiddenLabel',
    'historyNote',
    'narrower',
    'prefLabel',
    'related',
    'scopeNote',
] as const;

export const skos = Vocabulary(skosPrefix, skosTerms);

/**
 * Functional Requirements for Bibliographic Records (FRBR)
 * https://www.ifla.org/publications/functional-requirements-for-bibliographic-records
 * http://vocab.org/frbr/frbr-core-20050810.html
 * François Vignale has expressed the intent to use FRBR terms in the
 * ontology.
 */

export const frbrPrefix = 'http://purl.org/vocab/frbr/core#';

export const frbrTerms = [
    'adaptation',
    'adaptationOf',
    'embodiment',
    'embodimentOf',
    'exemplar',
    'exemplarOf',
    'Expression',
    'imitation',
    'imitationOf',
    'Item',
    'Manifestation',
    'owner',
    'ownerOf',
    'part',
    'partOf',
    'realization',
    'realizationOf',
    'reproduction',
    'reproductionOf',
    'revision',
    'revisionOf',
    'transformation',
    'transformationOf',
    'translation',
    'translationOf',
    'Work',
] as const;

export const frbr = Vocabulary(frbrPrefix, frbrTerms);

/**
 * Web Annotation Vocabulary
 * https://www.w3.org/TR/2017/REC-annotation-vocab-20170223/
 */

const oaPrefix = 'http://www.w3.org/ns/oa#';

const oaTerms = [
    'Annotation',
    'Choice',
    'DataPositionSelector',
    'Direction',
    'FragmentSelector',
    'Motivation',
    'RangeSelector',
    'ResourceSelection',
    'Selector',
    'SpecificResource',
    'State',
    'TextPositionSelector',
    'TextQuoteSelector',
    'TextualBody',
    'TimeState',
    'XPathSelector',
    'bodyValue',
    'cachedSource',
    'canonical',
    'end',
    'exact',
    'hasBody',
    'hasEndSelector',
    'hasPurpose',
    'hasScope',
    'hasSelector',
    'hasSource',
    'hasStartSelector',
    'hasState',
    'hasTarget',
    'motivatedBy',
    'prefix',
    'processingLanguage',
    'refinedBy',
    'renderedVia',
    'sourceDate',
    'sourceDateEnd',
    'sourceDateStart',
    'start',
    'suffix',
    'textDirection',
    'via',
    'assessing',
    'bookmarking',
    'classifying',
    'commenting',
    'describing',
    'editing',
    'highlighting',
    'identifying',
    'linking',
    'moderating',
    'questioning',
    'replying',
    'tagging',
    'autoDirection',
    'ltrDirection',
    'rtlDirection',
] as const;

export const oa = Vocabulary(oaPrefix, oaTerms);

/**
 * Activity Vocabulary (ActivityStreams 2.0)
 * https://www.w3.org/TR/2017/REC-activitystreams-vocabulary-20170523/
 */

export const asPrefix = 'http://www.w3.org/ns/activitystreams#';

export const asTerms = [
    'Application',
    'first',
    'generator',
    'items',
    'last',
    'next',
    'OrderedCollection',
    'OrderedCollectionPage',
    'partOf',
    'prev',
    'startIndex',
    'totalItems',
] as const;

export const as = Vocabulary(asPrefix, asTerms);

/**
 * Dublin Core Metadata Initiative (DCMI) Metadata Terms
 * http://www.dublincore.org/specifications/dublin-core/dcmi-terms/2012-06-14/
 * Dublin Core has several namespaces, including /elements/1.1/,
 * /terms/ and /dcmitype/, commonly abbreviated as 'dc', 'dcterms'
 * and 'dctypes', respectively, which are recommended by the
 * Web Annotation vocabulary specification (see above). dcterms
 * supersedes dc, but we include dc as well because some of its terms
 * are recommended by the Web Annotation specification.
 */

export const dcPrefix = 'http://purl.org/dc/elements/1.1/';
export const dctermsPrefix = 'http://purl.org/dc/terms/';
export const dctypesPrefix = 'http://purl.org/dc/dcmitype/';

export const dcTerms = [
    'format',
    'language',
] as const;

export const dctermsTerms = [
    'abstract',
    'accessRights',
    'alternative',
    'audience',
    'available',
    'bibliographicCitation',
    'conformsTo',
    'contributor',
    'coverage',
    'created',
    'creator',
    'date',
    'dateAccepted',
    'dateCopyrighted',
    'dateSubmitted',
    'description',
    'extent',
    'format',
    'hasFormat',
    'hasPart',
    'hasVersion',
    'identifier',
    'isFormatOf',
    'isPartOf',
    'issued',
    'isVersionOf',
    'language',
    'license',
    'mediator',
    'medium',
    'modified',
    'provenance',
    'publisher',
    'references',
    'relation',
    'replaces',
    'requires',
    'rights',
    'rightsHolder',
    'source',
    'spatial',
    'subject',
    'temporal',
    'title',
    'type',
    'valid',
] as const;

export const dctypesTerms = [
    'Dataset',
    'MovingImage',
    'StillImage',
    'Sound',
    'Text',
] as const;

export const dc = Vocabulary(dcPrefix, dcTerms);
export const dcterms = Vocabulary(dctermsPrefix, dctermsTerms);
export const dctypes = Vocabulary(dctypesPrefix, dctypesTerms);

/**
 * Friend of a Friend (FOAF) Vocabulary 0.99
 * http://xmlns.com/foaf/spec/20140114.html
 */

export const foafPrefix = 'http://xmlns.com/foaf/0.1/';

export const foafTerms = [
    'age',
    'familyName',
    'givenName',
    'homepage',
    'knows',
    'mbox',
    'mbox_sha1sum',
    // 'name', // causes runtime error, use foaf('name') instead
    'nick',
    'Organization',
    'Person',
] as const;

export const foaf = Vocabulary(foafPrefix, foafTerms);

/**
 * schema.org
 * https://schema.org
 * https://schema.org/docs/schemas.html
 * There are lots of terms in this vocabulary, but we don't use most
 * of them because there is usually a more domain-specific alternative
 * vocabulary available.
 */

export const schemaPrefix = 'http://schema.org/';

export const schemaTerms = [
    'accessibilityFeature',
    'affiliation',
    'alternativeHeadline',
    'Audience',
    'audience',
    'author',
    'birthPlace',
    'color',
    'CreativeWork',
    'creator',
    'datePublished',
    'headline',
    'inLanguage',
    'location',
    // 'name', // causes runtime error, use schema('name') instead
    'Organization',
    'Person',
    'text'
] as const;

export const schema = Vocabulary(schemaPrefix, schemaTerms);

/**
 * ISO639-1
 * http://id.loc.gov/vocabulary/iso639-1/
 * Vocabulary with two letter codes for languages
 */

export const iso6391Prefix = 'http://id.loc.gov/vocabulary/iso639-1/';

export const iso6391Terms = [
    'en',
    'de',
    'fr',
    'nl'
] as const;

export const iso6391 = Vocabulary(iso6391Prefix, iso6391Terms);


/**
 * READ-IT global prefix
 */

export const READIT = nsRoot;

/**
 * READ-IT special vocabulary
 * (to be properly defined)
 */

export const vocabPrefix = READIT + 'vocab#';

export const vocabTerms = [
    'relevance',
] as const;

export const vocab = Vocabulary(vocabPrefix, vocabTerms);

/**
 * READ-IT team
 * (not really a vocabulary but still associated with a prefix)
 */

export const staffPrefix = READIT + 'staff#';

const staffNotHardcoded = [] as const;

export const staff = Vocabulary(staffPrefix, staffNotHardcoded);

/**
 * READ-IT ontology
 * (subject to change, so not hardcoding any terms)
 */

export const readitPrefix = READIT + 'ontology#';

const ontologyNotHardcoded = [] as const;

export const readit = Vocabulary(readitPrefix, ontologyNotHardcoded);

/**
 * READ-IT items
 * (not a vocabulary at all, but associated with a prefix nonetheless)
 */

export const itemPrefix = READIT + 'item/';

const itemsNotHardcoded = [] as const;

export const item = Vocabulary(itemPrefix, itemsNotHardcoded);

/**
 * READ-IT source(s)
 * (not a vocabulary at all, but associated with a prefix nonetheless)
 */

export const sourcePrefix = READIT + 'source/';

const sourcesNotHardcoded = [] as const;

export const source = Vocabulary(sourcePrefix, sourcesNotHardcoded);


/**
 *  URI for representing an unauthenticated visitor, a source with unknown/multiple languages, or unknown source type.
 *  Probably not the best possible, but it will do for now.
 */
export const UNKNOWN = 'https://www.wikidata.org/wiki/Q24238356'
