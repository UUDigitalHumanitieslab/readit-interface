import { t } from 'i18next';

import Collection from '../core/collection';
import { xsd } from '../common-rdf/ns';

export const logic = new Collection([{
    id: 'logic:and',
    label: t('filters.and', 'AND'),
}, {
    id: 'logic:or',
    label: t('filters.or', 'OR'),
}, {
    id: 'logic:not',
    label: t('filters.not', 'NOT'),
}]);

export const filters = new Collection([{
    id: 'filter:equals',
    label: t('filters.equals', 'Is exactly'),
    uris: true,
    literals: true,
}, {
    id: 'filter:less',
    label: t('filters.less', 'Is less than'),
    uris: false,
    literals: true,
}, {
    id: 'filter:greater',
    label: t('filters.greater', 'Is greater than'),
    uris: false,
    literals: true,
}, {
    id: 'filter:isIRI',
    label: t('filters.isDefined', 'Is defined'),
    uris: true,
    literals: false,
}, {
    id: 'filter:isLiteral',
    label: t('filters.isDefined', 'Is defined'),
    uris: false,
    literals: true,
}, {
    id: 'filter:stringStarts',
    label: t('filters.startsWith', 'Starts with'),
    uris: false,
    literals: true,
    restrict: [xsd.string],
}, {
    id: 'filter:stringEnds',
    label: t('filters.endsWith', 'Ends with'),
    uris: false,
    literals: true,
    restrict: [xsd.string],
}, {
    id: 'filter:stringContains',
    label: t('filters.contains', 'Contains'),
    uris: false,
    literals: true,
    restrict: [xsd.string],
}, {
    id: 'filter:regex',
    label: t('filters.matchRegex', 'Matches regular expression'),
    uris: false,
    literals: true,
    restrict: [xsd.string],
}]);

export const groupLabels = new Collection([{
    id: 'logic',
    label: t('filters.groupLogic', 'apply logic'),
}, {
    id: 'filter',
    label: t('filters.groupFilters', 'apply filter'),
}, {
    id: 'type',
    label: t('filters.groupType', 'expect type'),
}, {
    id: 'predicate',
    label: t('filters.groupPredicates', 'traverse predicate'),
}]);
