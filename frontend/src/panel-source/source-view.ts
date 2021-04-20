import { after, once, extend } from 'lodash';
import { ViewOptions as BaseOpt, $ } from 'backbone';
import { SubViewDescription } from 'backbone-fractal/dist/composite-view';

import Model from '../core/model';
import { CompositeView } from '../core/view';
import { schema, vocab } from '../common-rdf/ns';
import Node from '../common-rdf/node';
import FlatItem from '../common-adapters/flat-item-model';
import FlatCollection from '../common-adapters/flat-annotation-collection';
import ToggleMixin from '../category-colors/category-toggle-mixin';
import SegmentCollection from '../highlight/text-segment-collection';
import { AnnotationPositionDetails } from '../utilities/annotation-utilities';
import explorerChannel from '../explorer/explorer-radio';
import { announceRoute } from '../explorer/utilities';

import HighlightableTextView from './highlightable-text-view';
import SourceToolbarView from '../toolbar/toolbar-view';
import MetadataView from './source-metadata-view';
import sourceTemplate from './source-template';

const announce = announceRoute('source:bare', ['model', 'id']);

export interface ViewOptions extends BaseOpt<Model> {
    // An instance of vocab('Source').
    model: Node;

    // The collection of annotations (and the items representing their details)
    // associated with the source.
    collection: FlatCollection;

    // Specify whether the View should only display annotations, or if it allows
    // editing them. Defaults to false.
    isEditable?: boolean;

    // Specify whether highlights should be displayed when the view becomes
    // visible. Defaults to false.
    showHighlightsInitially?: boolean;
}

/**
 * The panel that displays a single source, with buttons and highlights. It is
 * self-rendering, i.e., calling `.render()` on it is not necessary.
 *
 * It has the CategoryToggleMixin to implement showing and hiding highlights.
 * For now, it is just show all/hide all, but in the future, we can use this to
 * selectively show only specific types of annotations as well.
 */
interface SourcePanel extends ToggleMixin {}
class SourcePanel extends CompositeView {
    model: Node;
    collection: FlatCollection;
    isEditable: boolean;

    // Store reference to the instance of HighlightableTextView utilized by this
    // view.
    htv: HighlightableTextView;

    metaView: MetadataView;

    // Keep track of visiblility of the view mode.
    isInFullScreenViewMode: boolean;

    toolbar: SourceToolbarView;
    sourceContainer: any;
    toolbarModel: Model;

    // Method that is repeatedly invoked to track whether we can already safely
    // render highlights. Dynamically generated inside the constructor.
    _triggerHighlighting: () => void;

    constructor(options?: ViewOptions) {
        super(options);
        this.validate();
        this.toolbarModel = new Model({
            metadata: false,
            annotations: options.showHighlightsInitially || false
        });
        this.toolbar = new SourceToolbarView({ model: this.toolbarModel }).render();
        this.isEditable = options.isEditable || false;
        this.metaView = new MetadataView({
            model: this.model
        });
        this.render();

        if (!options.showHighlightsInitially) {
            this.hideHighlights();
        }

        this.metaView.$el.hide();

        // Will be called three times: once when the annotations are complete,
        // once when this view is activated, and once when the text is complete.
        // On the third call, regardless of the order, we get to business.
        this._triggerHighlighting = after(3, this._activateHighlights);
        // Trigger #1.
        this.listenToOnce(
            this.collection, 'complete:all', this._triggerHighlighting
        );
        // Trigger #2.
        this.activate = once(this.activate);
        // Trigger #3. Might be sync or async.
        this.model.when('@type', this.processText, this);

        this.metaView.on('metadata:hide', this.hideMetadata, this);
        this.metaView.on('metadata:edit', this.editMetadata, this);
        this.listenTo(this.toolbarModel, 'change:metadata', this.toggleMetadata);
        this.listenTo(this.toolbarModel, 'change:annotations', this.toggleHighlights);
        this.on('announceRoute', announce);
    }

    processText(): this {
        const text = this.model.get(schema.text);
        if (text && text.length) {
            this._createHtv(text[0] as string);
        } else {
            // Traversing the JSON serialization, instead of a regular
            // `model.get`, because the URI dereferences to plain text instead
            // of a RDF-formatted resource and this would trip up the
            // `Store.obtain()` call.
            $.get(
                this.model.getRaw(vocab('fullText'))[0]['@id'] as string
            ).then(this._createHtv.bind(this));
        }
        return this;
    }

    validate(): void {
        if (this.model == undefined) {
            throw RangeError("model cannot be undefined");
        }
    }

    // Internal method that creates `this.htv` and then sets some other things
    // in motion that depend on it. This should be invoked only once; the
    // constructor ensures this.
    _createHtv(text: string): void {
        this.htv = new HighlightableTextView({
            text,
            collection: new SegmentCollection(this.collection),
            isEditable: this.isEditable
        }).on('textSelected', this.onTextSelected, this);
        this.render()._triggerHighlighting();
    }

    /**
     * Public method to inform the view that it is attached to the `document`.
     */
    activate(): this {
        this._triggerHighlighting();
        return this;
    }

    // Internal method that is invoked when `this._triggerHighlighting` has been
    // called three times. This causes the higlights to be rendered. Whether
    // they are visible is independently controlled by the toggle mixin.
    _activateHighlights(): void {
        this.htv.render().activate();
        this.trigger('ready', this);
    }

    /**
     * List of subviews required by CompositeView. We generate it dynamically because `this.htv` might not exist when `.render()` or `.remove()` is invoked.
     */
    subviews(): SubViewDescription[] {
        const list: SubViewDescription[] = [{
            view: this.toolbar,
            selector: 'source-toolbar',
            method: 'replaceWith',
        }];
        if (this.htv) list.push({
            view: this.htv,
            selector: 'highlightable-text-view',
            method: 'replaceWith',
        });
        if (this.metaView) list.push({
            view: this.metaView,
            selector: 'metadata-view',
            method: 'replaceWith',
        });
        return list;
    }

    renderContainer(): this {
        const names = this.model.get(schema('name'));
        this.$el.html(this.template({
            title: names ? names[0] : ''
        }));
        return this;
    }

    /**
     * Pass events from HighlightableTextView
     */
    onTextSelected(range: Range, posDetails: AnnotationPositionDetails): void {
        explorerChannel.trigger('sourceview:textSelected', this, this.model, range, posDetails);
    }

    showHighlights(): this {
        this.toggleCategories();
        return this;
    }

    hideHighlights(): this {
        this.toggleCategories([]);
        return this;
    }

    hideMetadata(): this {
        this.toolbarModel.set('metadata', false);
        return this;
    }

    editMetadata(): this {
        // TO DO
        return this;
    }

    toggleMetadata(): this {
        if (this.toolbarModel.get('metadata')===true) {
            this.htv.$el.hide();
            this.metaView.$el.show();
        } else {
            this.metaView.$el.hide();
            this.htv.$el.show();
        }
        return this;
    }

    /**
     * Toggle highlights on and off.
     */
    toggleHighlights(): this {
        if (this.toolbarModel.get('annotations') === true) {
            this.showHighlights();
            explorerChannel.trigger('sourceview:showAnnotations', this, true);
        }
        else {
            this.hideHighlights();
            explorerChannel.trigger('sourceview:hideAnnotations', this);
        }
        return this;
    }

    scrollTo(annotation: FlatItem): void {
        this.htv.scrollTo(annotation);
    }

}
export default SourcePanel;

extend(SourcePanel.prototype, ToggleMixin.prototype, {
    className: 'source explorer-panel',
    template: sourceTemplate,
});
