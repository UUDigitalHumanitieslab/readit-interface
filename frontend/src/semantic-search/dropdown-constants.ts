import { each } from 'lodash';
import { history } from 'backbone';
import * as i18next from 'i18next';

import Collection from '../core/collection';
import { xsd } from '../common-rdf/ns';
import i18nChannel from '../i18n/radio';

/**
 * In this module, we define the logic operators, filters and option groups
 * that are available inside the Dropdown view. Each model has a `label` and an
 * `i18nKey`. The labels get translated automatically when i18next is ready.
 */

export const logic = new Collection([{
    id: 'logic:and',
    // i18next.t('search.filters.and', 'AND');
    label: 'AND',
    i18nKey: 'search.filters.and',
}, {
    id: 'logic:or',
    // i18next.t('search.filters.or', 'OR');
    label: 'OR',
    i18nKey: 'search.filters.or',
}, {
    id: 'logic:not',
    // i18next.t('search.filters.not', 'NOT');
    label: 'NOT',
    i18nKey: 'search.filters.not',
}]);

// The `uris`, `literals` and `restrict` attributes of each filter enable the
// Dropdown view to determine whether a filter is applicable to the current
// selection. The `operator` and `function` attributes inform SPARQL generation
// in the modelToQuery algorithm.
export const filters = new Collection([{
    id: 'filter:equals',
    label: 'Is exactly',
    i18nKey: 'search.filters.equals',
    // i18next.t('search.filters.equals', 'Is exactly');
    uris: true,
    literals: true,
    operator: '=',
}, {
    id: 'filter:less',
    label: 'Is less than',
    i18nKey: 'search.filters.less',
    // i18next.t('search.filters.less', 'Is less than');
    uris: false,
    literals: true,
    operator: '<',
}, {
    id: 'filter:greater',
    label: 'Is greater than',
    i18nKey: 'search.filters.greater',
    // i18next.t('search.filters.greater', 'Is greater than');
    uris: false,
    literals: true,
    operator: '>',
}, {
    id: 'filter:isIRI',
    label: 'Is defined',
    i18nKey: 'search.filters.isDefined',
    // i18next.t('search.filters.isDefined', 'Is defined');
    uris: true,
    literals: false,
    function: 'isIRI',
}, {
    id: 'filter:isLiteral',
    label: 'Is defined',
    i18nKey: 'search.filters.isDefined',
    // i18next.t('search.filters.isDefined', 'Is defined');
    uris: false,
    literals: true,
    function: 'isLiteral',
}, {
    id: 'filter:stringStarts',
    label: 'Starts with',
    i18nKey: 'search.filters.startsWith',
    // i18next.t('search.filters.startsWith', 'Starts with');
    uris: false,
    literals: true,
    restrict: [xsd.string],
    function: 'strStarts',
}, {
    id: 'filter:stringEnds',
    label: 'Ends with',
    i18nKey: 'search.filters.endsWith',
    // i18next.t('search.filters.endsWith', 'Ends with');
    uris: false,
    literals: true,
    restrict: [xsd.string],
    function: 'strEnds',
}, {
    id: 'filter:stringContains',
    label: 'Contains',
    i18nKey: 'search.filters.contains',
    // i18next.t('search.filters.contains', 'Contains');
    uris: false,
    literals: true,
    restrict: [xsd.string],
    function: 'contains',
}, {
    id: 'filter:regex',
    label: 'Matches regular expression',
    i18nKey: 'search.filters.matchRegex',
    // i18next.t('search.filters.matchRegex', 'Matches regular expression');
    uris: false,
    literals: true,
    restrict: [xsd.string],
    function: 'regex',
}]);

export const groupLabels = new Collection([{
    id: 'logic',
    // i18next.t('search.filters.groupLogic', 'apply logic');
    label: 'apply logic',
    i18nKey: 'search.filters.groupLogic',
}, {
    id: 'filter',
    // i18next.t('search.filters.groupFilters', 'apply filter');
    label: 'apply filter',
    i18nKey: 'search.filters.groupFilters',
}, {
    id: 'type',
    // i18next.t('search.filters.groupType', 'expect type');
    label: 'expect type',
    i18nKey: 'search.filters.groupType',
}, {
    id: 'predicate',
    // i18next.t('search.filters.groupPredicates', 'traverse predicate');
    label: 'traverse predicate',
    i18nKey: 'search.filters.groupPredicates',
}]);

function translateLabel(model) {
    const { label, i18nKey } = model.attributes;
    model.set('label', i18next.t(i18nKey, label));
}

function translateCollection(collection) {
    collection.each(translateLabel);
}

(async function() {
    await i18nChannel.request('i18next');
    each([logic, filters, groupLabels], translateCollection);
}());
