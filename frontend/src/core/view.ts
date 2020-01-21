import { bind, assign } from 'lodash'
import { View as BView } from 'backbone';
import {
    CompositeView as BCompositeView,
    CollectionView as BCollectionView,
} from 'backbone-fractal';
import { TemplateDelegate } from 'handlebars';

import Model from './model';
import Collection from './collection';

/**
 * This is the base view class that all views in the application
 * should derive from, either directly or indirectly. If you want to
 * apply a customization to all views in the application, do it here.
 */
export default class View<M extends Model = Model> extends BView<M> {
    template: TemplateDelegate;
    extraLoggingInfo: any;

    constructor(options?) {
        super(options);

        if (window['DEBUGGING'])
            this.$el.on('click', bind(this.onBaseClick, this));
    }

    onBaseClick(event: JQueryEventObject): this {
        if (event.altKey) {
            this.logInfo();
        }
        return this;
    }

    logInfo(): this {
        if (this.cid == "view1") return this; // ignore internalLinkEnabler
        console.log(this);
        if (this.extraLoggingInfo) console.log(this.extraLoggingInfo);
        return this;
    }
}

export class CompositeView<M extends Model = Model> extends View<M> {}

export interface CompositeView<M extends Model = Model> extends BCompositeView<M> {
    render(): this;
    remove(): this;
}

assign(CompositeView.prototype, BCompositeView.prototype);

export class CollectionView<M extends Model = Model, SV extends BView = View> extends View<M> {}

export interface CollectionView<M extends Model = Model, SV extends BView = View> extends BCollectionView<SV> {
    model: M;
    collection: Collection<M>;
    initialize: View<M>['initialize'];
    preinitialize: View<M>['preinitialize'];
    render(): this;
    remove(): this;
    setElement: View<M>['setElement'];
    delegate: View<M>['delegate'];
    undelegate: View<M>['undelegate'];
}

assign(CollectionView.prototype, BCollectionView.prototype);
