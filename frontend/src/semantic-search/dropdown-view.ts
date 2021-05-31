import { extend, includes, debounce, chain, each, propertyOf } from 'lodash';
import { SubViewDescription } from 'backbone-fractal/dist/composite-view';
import 'select2';

import Model from '../core/model';
import Collection from '../core/collection';
import View, { CompositeView, CollectionView } from '../core/view';
import { xsd, rdfs } from '../common-rdf/ns';
import ldChannel from '../common-rdf/radio';
import Node from '../common-rdf/node';
import Graph from '../common-rdf/graph';
import FilteredCollection from '../common-adapters/filtered-collection';
import FlatCollection from '../common-adapters/flat-item-collection';
import BasePicker from '../forms/base-picker-view';
import Select2Picker from '../forms/select2-picker-view';
import {
    isRdfsClass,
    getRdfSubClasses ,
} from '../utilities/linked-data-utilities';
import { applicablePredicates } from '../utilities/relation-utilities';

import { logic, filters, groupLabels } from './dropdown-constants';
import dropdownTemplate from './dropdown-template';

/**
 * Generate a filter predicate for selecting filters that apply to a given
 * range. Meant to use with a `FilteredCollection` layered on top of the
 * `filters` constant.
 */
function applicableTo(range: string): (Model) => boolean {
    const isLiteral = range.startsWith(xsd());
    return (model) => {
        const { uris, literals, restrict } = model.attributes;
        if (restrict) return includes(restrict, range);
        return isLiteral ? literals : uris;
    }
}

async function normalizeRange(model: Model): Promise<Graph> {
    let range;
    const precedent = model.get('precedent');
    if (precedent) {
        range = precedent.get(rdfs.range);
        range = range ? getRdfSubClasses(range) : [precedent];
    } else {
        const ontology = await ldChannel.request('ontology:promise');
        range = ontology.filter(isRdfsClass);
    }
    const rangeGraph = new Graph(range)
    return rangeGraph;
}

class Option extends View {
    initialize(): void {
        this.render().listenTo(this.model, 'change', this.render);
    }
    render(): this {
        const label = this.model.get('label') || this.model.get('classLabel');
        this.$el.prop('value', this.model.id).text(label);
        return this;
    }
}
extend(Option.prototype, {
    tagName: 'option',
});

class OptionGroup extends CollectionView {
    initialize(): void {
        this.initItems().render().initCollectionEvents();
    }
    renderContainer(): this {
        this.$el.prop('label', this.model.get('label'));
        return this;
    }
}
extend(OptionGroup.prototype, {
    tagName: 'optgroup',
    subview: Option,
});

export default class Dropdown extends CompositeView {
    logicGroup: View;
    filterGroup: View;
    typeGroup: View;
    predicateGroup: View;
    groupOrder: Array<keyof Dropdown>;
    val: BasePicker['val'];
    open: Select2Picker['open'];

    async initialize(): Promise<void> {
        this.model = this.model || new Model();
        this.restoreSelection = debounce(this.restoreSelection, 50);
        this.logicGroup = new OptionGroup({
            model: groupLabels.get('logic'),
            collection: logic,
        });
        let range: Graph | Node = this.model.get('range') as Graph;
        if (!range) {
            range = await normalizeRange(this.model);
            this.model.set('range', range);
        }
        if (range.length > 1) {
            this.typeGroup = new OptionGroup({
                model: groupLabels.get('type'),
                collection: new FlatCollection(range),
            });
        } else {
            range = range.at(0);
            const criterion = applicableTo(range.id);
            this.filterGroup = new OptionGroup({
                model: groupLabels.get('filter'),
                // For some reason, TS decided to reinterpret
                // `FilteredCollection`'s first parameter type as
                // `Backbone.Collection<Model> and `filters` as a
                // `Collection<Backbone.Model>`, which gave a lot of trouble.
                // While there is no reason for TS to make these inferences in
                // the first place, reaffirming that `filters` is a regular
                // `Collection<Model>` does solve the issue. Damn you TS!
                collection: new FilteredCollection(filters as Collection, criterion),
            });
            const predicates = applicablePredicates(range.id);
            this.listenTo(predicates, 'update', this.restoreSelection);
            this.predicateGroup = new OptionGroup({
                model: groupLabels.get('predicate'),
                collection: new FlatCollection(predicates),
            });
        }
        this.render();
        if (this.model.has('precedent') && !this.model.has('selection')) (
            this.typeGroup || this.predicateGroup
        ).collection.once('complete:all', this.open, this);
    }

    subviews(): SubViewDescription[] {
        return chain(this.groupOrder)
            .map(propertyOf(this))
            .compact()
            .map(view => ({ selector: 'select', view }))
            .value();
    }

    placeSubviews(): this {
        super.placeSubviews();
        return this.restoreSelection();
    }

    renderContainer(): this {
        this.$el.html(this.template({}));
        return this;
    }

    afterRender(): this {
        Select2Picker.prototype.afterRender.call(this);
        return this.trigger('ready', this);
    }

    remove(): this {
        this.$('select').select2('destroy');
        return super.remove();
    }

    restoreSelection(): this {
        const selection = this.model.get('selection');
        this.val(selection && selection.id);
        return this;
    }

    forwardChange(event): void {
        const id = this.val() as string;
        const scheme = id.split(':')[0];
        const model = (
            scheme === 'logic' ? logic.get(id) :
            scheme === 'filter' ? filters.get(id) :
            ldChannel.request('obtain', id)
        );
        this.model.set('selection', model);
        if (
            this.predicateGroup &&
            this.predicateGroup.collection.has(model.id)
        ) {
            this.model.set('traversal', true);
        } else {
            this.model.unset('traversal');
        }
        this.trigger('change', this, model, event);
    }
}

extend(Dropdown.prototype, {
    className: 'control',
    template: dropdownTemplate,
    groupOrder: ['logicGroup', 'typeGroup', 'filterGroup', 'predicateGroup'],
    events: { change: 'forwardChange' },
    val: BasePicker.prototype.val,
    open: Select2Picker.prototype.open,
    beforeRender: Select2Picker.prototype.beforeRender,
});
