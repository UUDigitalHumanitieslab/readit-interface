import { extend, map } from 'lodash';

import externalResourceEditItemTemplate from './external-resource-edit-item-template';
import Model from '../core/model';
import Collection from '../core/collection';
import View from '../core/view';
import ExternalUrl from './external-url-view';

export default class ExternalResourceEditItem extends View {

    initialize() {
        this.collection = this.model.get('urls');
        // this.initItems().render().initCollectionEvents();
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    makeItem(model: Model): ExternalUrl {
        const url = new ExternalUrl({model});
        this.listenToOnce(url, 'remove', this.removeUrl);
        this.listenTo(model, 'change', this.updateUrls);
        return url;
    }

    removeUrl(url: Model): this {
        this.collection.remove(url);
        this.model.unset(this.model.get('predicate'), url.get('url'));
        this.changeUrls();
        return this;
    }

    addUrl(): this {
        this.collection.add(new Model({url: ''}));
        return this;
    }

    updateUrls(url: Model): this {
        if (url.get('url')!=='') {
            this.model.set(this.model.get('predicate'), url.get('url'));
        }
        this.changeUrls();
        return this;
    }

    changeUrls(): this {
        this.model.set('urls', new Collection(this.collection.models));
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