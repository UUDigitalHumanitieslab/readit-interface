import { map, extend, fromPairs } from 'lodash';
import * as i18next from 'i18next';

import { CompositeView } from '../core/view';
import ldChannel from '../common-rdf/radio';
import { xsd } from '../common-rdf/ns';

import ScopedIriLink from './scoped-iri-href-view';
import template from './detected-type-help-template';

// i18next.t('property.typeHints.integer')
// i18next.t('property.typeHints.base64Binary')
// i18next.t('property.typeHints.gYear')
// i18next.t('property.typeHints.string')
const typesWithHints = ['integer', 'base64Binary', 'gYear', 'string'];
const typeAsPair = name => [xsd[name], `property.typeHints.${name}`];
const disambiguationHints = fromPairs(map(typesWithHints, typeAsPair));
const getHint = type => i18next.t(disambiguationHints[type]);

/**
 * This is one of the p.help views used in LinkedItemEditor, to give the user
 * feedback about the type that is currently detected in their input.
 */
export default class DetectedTypeHelpText extends CompositeView {
    typeLink: ScopedIriLink;

    initialize(): void {
        this.listenTo(this.model, {
            'change:jsonld': this.updateType,
            'change': this.render,
        }).updateType().render();
    }

    updateType(): this {
        const jsonld = this.model.get('jsonld');
        const currentType = jsonld && jsonld['@type'];
        const typeLink = this.typeLink;
        if (typeLink) {
            if (typeLink.model.id === currentType) return this;
            typeLink.remove();
            delete this.typeLink;
        }
        if (!currentType) return this;
        const model = ldChannel.request('obtain', currentType);
        this.typeLink = new ScopedIriLink({ model });
        return this;
    }

    renderContainer(): this {
        this.$el.html(this.template({
            typeHints: map(this.model.get('ambiguous'), getHint),
        }));
        return this;
    }
}

extend(DetectedTypeHelpText.prototype, {
    tagName: 'p',
    className: 'help',
    template,
    subviews: [{
        view: 'typeLink',
        selector: 'span',
    }],
});
