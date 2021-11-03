import Handlebars from 'handlebars/dist/handlebars.runtime';

import sparqlPreamble from '../sparql/query-templates/preamble-template';

Handlebars.registerPartial('sparqlPreamble', sparqlPreamble);
