import { extend, map } from 'lodash';

import externalResourceEditItemTemplate from './external-resource-edit-item-template';
import Model from '../core/model';
import Collection from '../core/collection';
import CompositeView from '../core/view';
import PickerView from '../forms/base-picker-view';
import ExternalUrl from './external-url-view';
import Graph from '../jsonld/graph';
import Node from '../jsonld/node';
import { owl, rdfs, item } from '../jsonld/ns';

const externalAttributes = [
    rdfs.seeAlso,
    owl.sameAs
];

export default class ExternalResourceEditItem extends CompositeView {
    predicatePicker: PickerView;
    predicates: Graph;
    url: string;

    initialize() {
        this.url = this.model.get(Object.keys(this.model.attributes)[0]);
        this.predicates = new Graph( externalAttributes.map( attr =>  {
            let node = new Node();
            node.set('@id', attr);
            return node;
        })
        );
        this.predicatePicker = new PickerView({collection: this.predicates});
        this.render();
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
    subviews: [{
        view: 'predicatePicker',
        selector: '.control:first-child',
    },],
    container: '.url-container',
    events: {
        'click .add': 'addUrl'
    }
})

if (window['DEBUGGING']) {
    window['ExternalResourceEditItem'] = ExternalResourceEditItem;
}