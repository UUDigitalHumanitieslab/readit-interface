import { each } from 'lodash';
import { history } from 'backbone';
import { t } from 'i18next';

import Collection from '../core/collection';
import { xsd } from '../common-rdf/ns';

/**
 * In this module, we define the logic operators, filters and option groups
 * that are available inside the Dropdown view. Each model has a `label` and an
 * `i18nKey`. The labels get translated automatically when i18next is ready.
 */

export const logic = new Collection([{
    id: 'logic:and',
    label: 'AND',
    i18nKey: 'filters.and',
}, {
    id: 'logic:or',
    label: 'OR',
    i18nKey: 'filters.or',
}, {
    id: 'logic:not',
    label: 'NOT',
    i18nKey: 'filters.not',
}]);

// The `uris`, `literals` and `restrict` attributes of each filter enable the
// Dropdown view to determine whether a filter is applicable to the current
// selection. The `operator` and `function` attributes inform SPARQL generation
// in the modelToQuery algorithm.
export const filters = new Collection([{
    id: 'filter:equals',
    label: 'Is exactly',
    i18nKey: 'filters.equals',
    uris: true,
    literals: true,
    operator: '=',
}, {
    id: 'filter:less',
    label: 'Is less than',
    i18nKey: 'filters.less',
    uris: false,
    literals: true,
    operator: '<',
}, {
    id: 'filter:greater',
    label: 'Is greater than',
    i18nKey: 'filters.greater',
    uris: false,
    literals: true,
    operator: '>',
}, {
    id: 'filter:isIRI',
    label: 'Is defined',
    i18nKey: 'filters.isDefined',
    uris: true,
    literals: false,
    function: 'isIRI',
}, {
    id: 'filter:isLiteral',
    label: 'Is defined',
    i18nKey: 'filters.isDefined',
    uris: false,
    literals: true,
    function: 'isLiteral',
}, {
    id: 'filter:stringStarts',
    label: 'Starts with',
    i18nKey: 'filters.startsWith',
    uris: false,
    literals: true,
    restrict: [xsd.string],
    function: 'strStarts',
}, {
    id: 'filter:stringEnds',
    label: 'Ends with',
    i18nKey: 'filters.endsWith',
    uris: false,
    literals: true,
    restrict: [xsd.string],
    function: 'strEnds',
}, {
    id: 'filter:stringContains',
    label: 'Contains',
    i18nKey: 'filters.contains',
    uris: false,
    literals: true,
    restrict: [xsd.string],
    function: 'contains',
}, {
    id: 'filter:regex',
    label: 'Matches regular expression',
    i18nKey: 'filters.matchRegex',
    uris: false,
    literals: true,
    restrict: [xsd.string],
    function: 'regex',
}]);

export const groupLabels = new Collection([{
    id: 'logic',
    label: 'apply logic',
    i18nKey: 'filters.groupLogic',
}, {
    id: 'filter',
    label: 'apply filter',
    i18nKey: 'filters.groupFilters',
}, {
    id: 'type',
    label: 'expect type',
    i18nKey: 'filters.groupType',
}, {
    id: 'predicate',
    label: 'traverse predicate',
    i18nKey: 'filters.groupPredicates',
}]);

function translateLabel(model) {
    const { label, i18nKey } = model.attributes;
    model.set('label', t(i18nKey, label));
}

function translateCollection(collection) {
    collection.each(translateLabel);
}

function translateAll() {
    each([logic, filters, groupLabels], translateCollection);
}

history.once('route notfound', translateAll);
