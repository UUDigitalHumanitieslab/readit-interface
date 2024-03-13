import { extend } from 'lodash';

import { CompositeView } from '../core/view';
import PickerView from '../forms/base-picker-view';
import RemoveButton from '../forms/remove-button-view';
import Graph from '../common-rdf/graph';
import Subject from '../common-rdf/subject';
import { owl, rdfs } from '../common-rdf/ns';

import externalResourceEditItemTemplate from './external-resource-edit-item-template';

const externalAttributes = [
    rdfs.seeAlso,
    owl.sameAs
];

export default class ExternalResourceEditItem extends CompositeView {
    predicatePicker: PickerView;
    removeButton: RemoveButton;
    predicates: Graph;
    url: string;

    initialize() {
        this.url = this.model.get('object');
        this.predicates = new Graph( externalAttributes.map( attr =>  {
            let node = new Subject();
            node.set('@id', attr);
            return node;
        })
        );
        this.predicatePicker = new PickerView({collection: this.predicates});
        if ( this.model.get('predicate') !== undefined ) {
            this.predicatePicker.val(this.model.get('predicate'));
        }
        this.predicatePicker.on('change', this.updatePredicate, this);
        this.removeButton = new RemoveButton().on('click', this.close, this);
        this.render();
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    close(): void {
        this.trigger('remove', this, this.model);
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
    className: 'field has-addons rit-external-resources-editor',
    subviews: [{
        view: 'predicatePicker',
        selector: '.control:first-child',
    }, 'removeButton'],
    events: {
        'change input': 'changeUrl',
    },
});

if (window['DEBUGGING']) {
    window['ExternalResourceEditItem'] = ExternalResourceEditItem;
}
