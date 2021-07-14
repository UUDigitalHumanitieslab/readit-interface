import { map } from 'lodash';

import { startStore, endStore } from '../test-util';
import mockOntology from '../mock-data/mock-ontology';

import Model from '../core/model';
import Collection from '../core/collection';
import Graph from '../common-rdf/graph';
import abstractDeepEqual from '../utilities/abstractDeepEqual';

import { logic, filters } from './dropdown-constants';
import SemanticQuery from './model';

describe('semantic search model', function() {
    beforeAll(startStore);
    beforeAll(function() {
        this.ontology = new Graph(mockOntology);
        this.model = new SemanticQuery({
            id: '1',
            label: 'test 123',
            query: new Model({
                chain: new Collection([{
                    range: this.ontology,
                    assertion: true,
                    selection: this.ontology.at(0),
                }, {
                    range: new Graph([this.ontology.at(0)]),
                    precedent: this.ontology.at(0),
                    selection: logic.get('logic:and'),
                }, {
                    range: new Graph([this.ontology.at(0)]),
                    precedent: this.ontology.at(0),
                    scheme: 'logic',
                    action: 'and',
                    branches: new Collection([{
                        chain: new Collection([{
                            range: new Graph([this.ontology.at(0)]),
                            precedent: this.ontology.at(0),
                            traversal: true,
                            selection: this.ontology.at(3),
                        }, {
                            range: this.ontology,
                            precedent: this.ontology.at(3),
                            selection: filters.get('filter:isIRI'),
                        }, {
                            filter: filters.get('filter:isIRI'),
                        }]),
                    }, {
                        chain: new Collection([{
                            range: this.ontology,
                            precedent: this.ontology.at(3),
                            selection: filters.get('filter:equals'),
                        }, {
                            filter: filters.get('filter:equals'),
                            value: 'https://example.example',
                        }]),
                    }]),
                }]),
            }),
        });
        const idOnlyOntology = this.ontology.map(m => ({ '@id': m.id }));
        this.minimalJSON = {
            id: '1',
            label: 'test 123',
            query: {
                chain: [{
                    range: idOnlyOntology,
                    assertion: true,
                    selection: idOnlyOntology[0],
                }, {
                    range: [idOnlyOntology[0]],
                    precedent: idOnlyOntology[0],
                    selection: { id: 'logic:and' },
                }, {
                    range: [idOnlyOntology[0]],
                    precedent: idOnlyOntology[0],
                    scheme: 'logic',
                    action: 'and',
                    branches: [{
                        chain: [{
                            range: [idOnlyOntology[0]],
                            precedent: idOnlyOntology[0],
                            traversal: true,
                            selection: idOnlyOntology[3],
                        }, {
                            range: idOnlyOntology,
                            precedent: idOnlyOntology[3],
                            selection: { id: 'filter:isIRI' },
                        }, {
                            filter: { id: 'filter:isIRI' },
                        }],
                    }, {
                        chain: [{
                            range: idOnlyOntology,
                            precedent: idOnlyOntology[3],
                            selection: { id: 'filter:equals' },
                        }, {
                            filter: { id: 'filter:equals' },
                            value: 'https://example.example',
                        }],
                    }],
                }],
            },
        };
    });
    afterAll(endStore);

    it('sends a lean representation to the backend', function() {
        const json = this.model.toJSON();
        expect(abstractDeepEqual(json, this.minimalJSON)).toBe(true);
    });

    it('can reconstruct the full representation from lean JSON', function() {
        const parsed = this.model.parse(this.minimalJSON);
        expect(abstractDeepEqual(parsed, this.model.attributes)).toBe(true);
    });
});
