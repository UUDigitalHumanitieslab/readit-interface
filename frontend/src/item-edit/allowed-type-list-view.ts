import { extend } from 'lodash';

import { CollectionView } from '../core/view';
import Subject from '../common-rdf/subject';

import ScopedIriHref from './scoped-iri-href-view';
import template from './allowed-type-list-template';

export default class AllowedTypesHelpText extends CollectionView<Subject> {
    initialize(): void {
        this.initItems().render().initCollectionEvents();
    }

    renderContainer(): this {
        this.$el.html(this.template({}));
        return this;
    }
}

extend(AllowedTypesHelpText.prototype, {
    tagName: 'p',
    className: 'help',
    template,
    container: '.rit-type-list',
    subview: ScopedIriHref,
});
