import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from '../../core/view';

import Node from '../../jsonld/node';
import Graph from '../../jsonld/graph';
import LabelView from './../label-view';

import OntologyClassPickerItemView from './ontology-class-picker-item-view';
import ontologyClassPickerTemplate from './ontology-class-picker-template';

export interface ViewOptions extends BaseOpt<Node> {
    collection: Graph;
    preselection?: Node;
}

export default class OntologyClassPickerView extends View<Node> {
    dropdownItems: OntologyClassPickerItemView[];
    selected: Node;
    preselection: Node;
    label: any;

    initialize(options: ViewOptions): this {
        if (!options.collection) throw new TypeError('collection cannot be null or undefined');
        this.initDropdownItems();

        let self = this;
        $(document).click(function () {
            self.hideDropdown();
        });

        this.preselection = options.preselection;
        return this;
    }

    initDropdownItems(): this {
        this.dropdownItems = [];
        this.collection.each((node) => {
            let view = new OntologyClassPickerItemView({ model: node });
            view.on('click', this.onItemClicked, this);
            view.on('activated', this.onItemActivated, this);
            this.dropdownItems.push(view);
        });
        return;
    }

    render(): this {
        this.dropdownItems.forEach((item) => item.$el.detach());
        this.$el.html(this.template(this));
        this.dropdownItems.forEach((item) => item.render().$el.appendTo(this.$('.dropdown-content')));
        if (this.preselection) this.select(this.preselection);
        return this;
    }

    getSelected(): Node {
        return this.selected || undefined;
    }

    select(newValue: Node) {
        this.dropdownItems.forEach((item) => {
            if (item.model === newValue) {
                item.activate();
                this.trigger('select', newValue);
            }
            else {
                item.deactivate();
            }
        });
    }

    setLabel(node: Node): this {
        let dropdownLabel = this.$('.dropdown-label-tag');
        console.log(dropdownLabel);
        if (this.label) this.label.remove();
        dropdownLabel.text('');
        this.label = new LabelView({ model: node });
        this.label.render().$el.appendTo(dropdownLabel);
        return this;
    }

    hideDropdown(): this {
        this.$('.dropdown').removeClass('is-active');
        return this;
    }

    onClick(event: any): this {
        this.$('.dropdown').toggleClass('is-active');
        event.stopPropagation();
        return this;
    }

    onItemClicked(view: OntologyClassPickerItemView): this {
        this.select(view.model);
        return this;
    }

    onItemActivated(view: OntologyClassPickerItemView): this {
        console.log('onacts')
        this.selected = view.model;
        this.setLabel(view.model);
        return this;
    }
}
extend(OntologyClassPickerView.prototype, {
    tagName: 'div',
    className: 'ontology-class-picker',
    template: ontologyClassPickerTemplate,
    events: {
        'click': 'onClick',
    }
});
