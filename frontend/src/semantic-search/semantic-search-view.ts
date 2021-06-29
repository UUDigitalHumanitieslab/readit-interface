import { extend } from 'lodash';

import Model from '../core/model';
import { CompositeView } from '../core/view';
import Multifield from '../forms/multifield-view';

import semChannel from './radio';
import Chain from './chain-view';
import Multibranch from './multibranch-view';
import semTemplate from './semantic-search-template';

/**
 * SemanticSearchView represents the semantic search form as a whole. It
 * consists of a single Chain (which can branch out to arbitrary width and
 * depth) and a submit button. SemanticSearchView is in charge of creating all
 * Multibranches inside the Chain. It also ensures that the submit button is
 * only enabled when the form is complete. Both of these features are
 * coordinated with the subviews through the semChannel.
 */
export default class SemanticSearchView extends CompositeView {
    topChain: Chain;
    // Counters to keep track of form completeness.
    // The number of chains currently present in the form.
    demand: number;
    // The number of chains that end with a filter OR a branchout with at least
    // one chain. Supply must meet demand in order for the form to be complete.
    supply: number;

    initialize(): void {
        this.supply = this.demand = 0;
        this.listenTo(semChannel, {
            'demand:increase': this.increaseDemand,
            'demand:decrease': this.decreaseDemand,
            'supply:increase': this.increaseSupply,
            'supply:decrease': this.decreaseSupply,
        });
        semChannel.reply('branchout', this.branchout, this);
        this.topChain = new Chain({ model: this.model });
        this.model = this.topChain.model;
        this.render();
    }

    renderContainer(): this {
        this.$el.html(this.template({}));
        this.checkCompleteness();
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

    increaseDemand(): void {
        ++this.demand;
        this.disableSubmit();
    }

    decreaseDemand(): void {
        --this.demand;
        this.checkCompleteness();
    }

    increaseSupply(): void {
        ++this.supply;
        this.checkCompleteness();
    }

    decreaseSupply(): void {
        --this.supply;
        this.disableSubmit();
    }

    disableSubmit(): void {
        this.$('.rit-submit-sem').prop('disabled', true);
    }

    checkCompleteness(): void {
        if (this.supply === this.demand) {
            this.$('.rit-submit-sem').prop('disabled', false);
        } else {
            this.disableSubmit();
        }
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
