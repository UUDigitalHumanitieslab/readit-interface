import { map, extend, propertyOf } from 'lodash';
import { t } from 'i18next';

import { CompositeView } from '../core/view';
import ldChannel from '../common-rdf/radio';
import { xsd } from '../common-rdf/ns';

import ScopedIriLink from './scoped-iri-href-view';
import template from './detected-type-help-template';

const disambiguationHints = {
    [xsd.integer]: t('typeHints.integer',
        'Include extra leading zeros to force interpretation ' +
        'as an integer type.'
    ),
    [xsd.base64Binary]: t('typeHints.base64Binary',
        'Include internal whitespace to force interpretation ' +
        'as base 64 binary data.'
    ),
    [xsd.gYear]: t('typeHints.gYear',
        'Include time zone information (such as a final "Z") to force ' +
        'interpretation as a Gregorian year.'
    ),
    [xsd.string]: t('typeHints.string',
        'Start with a space to force interpretation as text or ' +
        'a derived string type.'
    ),
};

const getHint = propertyOf(disambiguationHints);

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
