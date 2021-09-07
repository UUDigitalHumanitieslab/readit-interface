import { extend } from 'lodash';

import { CollectionView } from '../core/view';
import Node from '../common-rdf/node';

import ScopedIriHref from './scoped-iri-href-view';
import template from './allowed-type-list-template';

export default class AllowedTypesHelpText extends CollectionView<Node> {
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
