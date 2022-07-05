import { each, mapValues } from 'lodash';

import Model from '../core/model';
import View from '../core/view';
import i18nChannel from '../i18n/radio';
import attachTooltip, { Direction } from '../tooltip/tooltip-view';

// The utilities in this module make it easier to declaratively list the
// tooltips that should be attached to a view, with a notation similar to the
// view's `.events` hash. The core of this notation is a hash with string-based
// keys, where each key consists of the tooltip direction ('top', 'left',
// etcetera) optionally followed by the CSS selector of an element within the
// view. These two pieces of information are together referred to as the "place"
// of the tooltip. The value represents the content of the tooltip; there are
// two alternative forms for the content. Like with `.events`, the tooltips can
// be attached even when the view has not been `.render()`ed yet.

// In the first notation, the content is represented by an array of two strings.
// The first string is the `key` and the second string is the `defaultValue` for
// a call to `i18next`.
export interface TooltipData {
    [place: string]: [string, string];
}

// In the second notation, the content is represented by a `Model` with a `text`
// attribute. The previous notation can be converted to the current one with the
// `prepareTooltipData` function below.
export interface TooltipModels {
    [place: string]: Model;
}

// This regular expression lets us separate the (initial) tooltip direction from
// the (final, optional) CSS selector in a placement string.
const tooltipPlaceSplitter = /^(\S+)\s*(.*)$/;

// Convert the first notation to the second. This function takes into account
// that translation strings arrive async. A `Model` is returned immediately
// (i.e., synchronously) for each place, but the `text` attributes are only
// populated when the translation strings are available.
export function prepareTooltipData(tooltipData: TooltipData): TooltipModels {
    const i18nPromise = i18nChannel.request('i18next');
    return mapValues(tooltipData, ([key, defaultValue]) => {
        const model = new Model;
        i18nPromise.then(
            i18next => model.set('text', i18next.t(key, defaultValue))
        );
        return model;
    });
}

// Attach a hash of tooltips to a view, assuming the second notation.
export function bulkAttachTooltips(view: View, tooltips: TooltipModels): void {
    each(tooltips, (model, place) => {
        const [
            _, direction, selector
        ] = place.match(tooltipPlaceSplitter) as [string, Direction, string];
        attachTooltip(view, {model, direction}, selector)
    });
}
