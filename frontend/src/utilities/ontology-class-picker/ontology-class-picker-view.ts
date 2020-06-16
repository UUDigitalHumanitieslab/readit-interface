import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';

import { CollectionView } from '../../core/view';
import Node from '../../jsonld/node';
import LabelView from './../label-view';

import OntologyClassPickerItemView from './ontology-class-picker-item-view';
import ontologyClassPickerTemplate from './ontology-class-picker-template';

export interface ViewOptions extends BaseOpt<Node> {
    preselection?: Node;
}

export default class OntologyClassPickerView extends CollectionView<
    Node,
    OntologyClassPickerItemView
> {
    selected: Node;
    preselection: Node;
    label: any;
    externalCloseHandler: any;

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): this {
        this.initItems().initCollectionEvents();
        this.externalCloseHandler = $(document).click(() => this.hideDropdown());
        this.preselection = options.preselection;
        return this;
    }

    makeItem(model: Node): OntologyClassPickerItemView {
        return new OntologyClassPickerItemView({ model }).on({
            click: this.onItemClicked,
            activated: this.onItemActivated,
        }, this);
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }

    afterRender(): this {
        if (this.preselection) this.select(this.preselection);
        return this;
    }

    remove(): this {
        this.externalCloseHandler.off();
        if (this.label) this.label.remove();
        super.remove();
        return this;
    }

    getSelected(): Node {
        return this.selected;
    }

    select(newValue: Node) {
        this.items.forEach((item) => {
            if (item.model === newValue) {
                item.activate();
                this.trigger('select', newValue);
            } else {
                item.deactivate();
            }
        });
    }

    setLabel(node: Node): this {
        let dropdownLabel = this.$('.dropdown-label-tag');
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
        this.selected = view.model;
        this.setLabel(view.model);
        return this;
    }
}
extend(OntologyClassPickerView.prototype, {
    tagName: 'div',
    className: 'ontology-class-picker',
    template: ontologyClassPickerTemplate,
    container: '.dropdown-content',
    events: {
        'click': 'onClick',
    }
});
