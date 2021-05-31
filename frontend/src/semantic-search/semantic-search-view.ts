import { extend } from 'lodash';

import Model from '../core/model';
import { CompositeView } from '../core/view';
import Multifield from '../forms/multifield-view';

import semChannel from './radio';
import Chain from './chain-view';
import Multibranch from './multibranch-view';
import semTemplate from './semantic-search-template';

export default class SemanticSearchView extends CompositeView {
    topChain: Chain;

    initialize(): void {
        this.topChain = new Chain({ model: this.model });
        this.model = this.topChain.model;
        semChannel.reply('branchout', this.branchout, this);
        this.render();
    }

    renderContainer(): this {
        this.$el.html(this.template({}));
        return this;
    }

    remove(): this {
        semChannel.stopReplying('branchout', this.branchout);
        return super.remove();
    }

    branchout(model: Model): Multifield {
        const collectionView = new Multibranch({ model });
        const multifield = new Multifield({ collectionView });
        multifield.$el.addClass('control');
        return multifield;
    }

    onSubmit(event): void {
        event.preventDefault();
        this.trigger('search', this.model);
    }
}

extend(SemanticSearchView.prototype, {
    tagName: 'form',
    className: 'rit-semantic-search',
    template: semTemplate,
    subviews: [{
        view: 'topChain',
        method: 'after',
        selector: '.subtitle',
    }],
    events: {
        submit: 'onSubmit',
    },
});
