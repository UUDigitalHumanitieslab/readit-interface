import { extend, map } from 'lodash';
import View from '../core/view';

import externalResourceEditItemTemplate from './external-resource-edit-item-template';
import Model from '../core/model';
import Collection from '../core/collection';
import { CollectionView } from '../core/view';
import ExternalUrl from './external-url-view';

export default class ExternalResourceEditItem extends CollectionView {

    initialize() {
        this.collection = this.model.attributes.urls;
        this.initItems().render().initCollectionEvents();
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    makeItem(model: Model): ExternalUrl {
        const url = new ExternalUrl({model});
        this.listenToOnce(url, 'remove', this.removeUrl);
        this.listenTo(url, 'change', this.updateUrls);
        return url;
    }

    removeUrl(url: Model): this {
        this.collection.remove(url);
        this.changeUrls();
        return this;
    }

    addUrl(): this {
        this.collection.add(new Model({url: ''}));
        return this;
    }

    updateUrls(url: Model, urlValue: string): this {
        url.attributes.url = urlValue;
        this.changeUrls();
        return this;
    }

    changeUrls(): this {
        this.trigger('change', this.collection)
        return this;
    }
}

extend(ExternalResourceEditItem.prototype, {
    template: externalResourceEditItemTemplate,
    container: '.url-container',
    events: {
        'click .add': 'addUrl'
    }
})

if (window['DEBUGGING']) {
    window['ExternalResourceEditItem'] = ExternalResourceEditItem;
}