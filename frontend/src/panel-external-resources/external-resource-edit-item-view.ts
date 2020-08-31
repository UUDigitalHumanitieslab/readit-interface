import { extend } from 'lodash';

import externalResourceEditItemTemplate from './external-resource-edit-item-template';
import { CompositeView } from '../core/view';
import PickerView from '../forms/base-picker-view';
import Graph from '../jsonld/graph';
import Node from '../jsonld/node';
import { owl, rdfs } from '../jsonld/ns';

const externalAttributes = [
    rdfs.seeAlso,
    owl.sameAs
];

export default class ExternalResourceEditItem extends CompositeView {
    predicatePicker: PickerView;
    predicates: Graph;
    url: string;

    initialize() {
        this.url = this.model.get('object');
        this.predicates = new Graph( externalAttributes.map( attr =>  {
            let node = new Node();
            node.set('@id', attr);
            return node;
        })
        );
        this.predicatePicker = new PickerView({collection: this.predicates});
        if ( this.model.get('predicate') !== undefined ) {
            this.predicatePicker.val(this.model.get('predicate'));
        }
        this.predicatePicker.on('change', this.updatePredicate, this);
        this.render();
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    removeExternalResource(): this {
        this.trigger('remove', this, this.model);
        return this;
    }

    updatePredicate(view: PickerView, id: string): void {
        this.model.set('predicate', id);
        if (this.$('input').length === 0) {
            this.$('.url-input').append(`
                <input class="input" type="url" required>
            `)
        }
    }

    changeUrl(event): void {
        this.model.set('object', event.target.value);
    }
}

extend(ExternalResourceEditItem.prototype, {
    template: externalResourceEditItemTemplate,
    className: 'field has-addons rit-relation-editor',
    subviews: [{
        view: 'predicatePicker',
        selector: '.control:first-child',
    },],
    events: {
        'change input': 'changeUrl',
        'click .remove': 'removeExternalResource'
    }
})

if (window['DEBUGGING']) {
    window['ExternalResourceEditItem'] = ExternalResourceEditItem;
}