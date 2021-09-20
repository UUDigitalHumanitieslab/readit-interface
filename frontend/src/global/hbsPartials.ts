import Handlebars from 'handlebars/dist/handlebars.runtime';

import sparqlPreamble from '../sparql/query-templates/preamble-template';
import restrictToItems from '../sparql/query-templates/restrict-to-items-template';

Handlebars.registerPartial('sparqlPreamble', sparqlPreamble);
Handlebars.registerPartial('restrictToItems', restrictToItems);
