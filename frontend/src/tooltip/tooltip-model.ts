import * as i18next from 'i18next';

import Model from '../core/model';
import { rdfs, skos } from '../common-rdf/ns';
import FlatItem from '../common-adapters/flat-item-model';

/**
 * Model adapter that lets you feed a `FlatItem` to a `TooltipView`.
 *
 * `TooltipView` expects a model with just a `text` attribute. The adapter
 * extracts either the `skos:definition` or the `rdfs:comment`, depending on
 * which is available, from the underlying model, and sets this as the `text`
 * attribute. It takes the currently selected language into account.
 *
 * For optimum convenience, use the `toTooltip` helper function instead of
 * instantiating the class directly.
 */
export class FlatAsTooltipAdapter extends Model {
    constructor(underlying: FlatItem, options?: any) {
        super(null, options);
        underlying.when('classLabel', this.adapt, this);
    }

    adapt(underlying): void {
        const cls = underlying.get('class');
        const languageOption = { '@language': i18next.language };
        const definition = cls.get(skos.definition, languageOption);
        const comment = definition || cls.get(rdfs.comment, languageOption);
        const text = definition && definition[0] || comment && comment[0];
        this.set({text});
    }
}

/**
 * Helper function to wrap a `FlatItem` in a model with the expected attributes
 * for a `TooltipView`.
 */
export default function toTooltip(model: FlatItem) {
    return new FlatAsTooltipAdapter(model);
}
