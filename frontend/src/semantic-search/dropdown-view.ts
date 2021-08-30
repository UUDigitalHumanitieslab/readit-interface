import {
    extend,
    includes,
    debounce,
    chain,
    each,
    propertyOf,
    once,
} from 'lodash';
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

/**
 * Given a dropdown model, determine the classes that the current selection may
 * belong to. In case of insufficient information, assume all ontology classes.
 */
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
        this.render()
           .listenTo(this.model, 'change:label change:classLabel', this.render);
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

/**
 * Dropdown is a select2 form element composed out of OptionGroups. It inherits
 * some methods from BasePicker and Select2Picker. Every time the user picks an
 * option in a Dropdown, the containing Chain adds another form element after
 * it.
 */
export default class Dropdown extends CompositeView {
    // An option group for each of the four types of selection narrowing aids.
    logicGroup: View;
    filterGroup: View;
    typeGroup: View;
    predicateGroup: View;

    // Declaring these members to make TS aware of prototype extensions.
    groupOrder: Array<keyof Dropdown>;
    val: BasePicker['val'];
    open: Select2Picker['open'];

    // initialize is unusually complex because we need to determine which
    // options are applicable to the preceding selection.
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
            // If more than one possible type could come out of the preceding
            // selection, don't present filter or property traversal options but
            // ask the user to narrow the selection to a single type instead.
            this.typeGroup = new OptionGroup({
                model: groupLabels.get('type'),
                collection: new FlatCollection(range),
            });
        } else {
            // Otherwise, omit the type group since there is only one type.
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
        // Conditionally open the dropdown on creation. This helps the user to
        // type her way through the form, saving keystrokes.
        if (this.model.has('precedent') && !this.model.has('selection')) {
            this.listenToOnce(
                (this.typeGroup || this.predicateGroup).collection,
                'complete:all', this.open
            );
        }
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
        if (!selection || !selection.id) return this;
        const id = selection.id;
        const restore = once(() => this.val(id));
        const directTarget = logic.get(id) || filters.get(id);
        if (directTarget) {
            restore();
        } else {
            // Postpone restoring the selection until the value model has
            // acquired its label. Otherwise, select2 will keep the empty label
            // of the preselected option, causing the selected option to appear
            // blank while all other options have their proper labels.
            const delayedTarget = (
                this.typeGroup || this.predicateGroup
            ).collection.get(id);
            if (!delayedTarget) return this;
            delayedTarget.when('label', restore);
            delayedTarget.when('classLabel', restore);
        }
        return this;
    }

    // Handler for the form control's 'change' event.
    forwardChange(event): void {
        const id = this.val() as string;
        const scheme = id.split(':')[0];
        const model = (
            scheme === 'logic' ? logic.get(id) :
            scheme === 'filter' ? filters.get(id) :
            ldChannel.request('obtain', id)
        );
        this.model.set('selection', model);
        each({
            traversal: this.predicateGroup,
            assertion: this.typeGroup,
        }, (group, key) => {
            if (group && group.collection.has(model.id)) {
                this.model.set(key, true);
            } else {
                this.model.unset(key);
            }
        });
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
    destroySelect: Select2Picker.prototype.destroySelect,
});
