import { after, once, extend } from 'lodash';
import { ViewOptions as BaseOpt, $ } from 'backbone';
import { SubViewDescription } from 'backbone-fractal/dist/composite-view';

import Model from './../core/model';
import { CompositeView } from './../core/view';
import { schema, vocab } from './../jsonld/ns';
import Node from './../jsonld/node';
import FlatModel from '../annotation/flat-annotation-model';
import FlatCollection from '../annotation/flat-annotation-collection';
import ToggleMixin from '../utilities/category-colors/category-toggle-mixin';
import SegmentCollection from '../highlight/text-segment-collection';
import { isType } from './../utilities/utilities';
import { AnnotationPositionDetails } from '../utilities/annotation/annotation-utilities';

import HighlightableTextView from './highlightable-text-view';
import SourceToolbarView from './toolbar/source-toolbar-view';
import sourceTemplate from './source-template';

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

    // An annotation that will be scrolled to once the view is visible.
    initialScrollTo?: FlatModel;
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
    initialScrollTo?: FlatModel;

    // Store reference to the instance of HighlightableTextView utilized by this
    // view.
    htv: HighlightableTextView;

    // Keep track of visiblility of the highlights.
    isShowingHighlights: boolean;

    // Keep track of visiblility of the metadata.
    isShowingMetadata: boolean;

    // Keep track of visiblility of the view mode.
    isInFullScreenViewMode: boolean;

    // Highlight clicking mode allows the user to click highlights and see their
    // details. If this is false, we're in highlight text selection mode, which
    // allows users to select text in highlights. Defaults to false, i.e. text
    // selection mode.
    isInHighlightClickingMode: boolean;

    toolbar: SourceToolbarView;

    // Method that is repeatedly invoked to track whether we can already safely
    // render highlights. Dynamically generated inside the constructor.
    _triggerHighlighting: () => void;

    constructor(options?: ViewOptions) {
        super(options);
        this.validate();

        this.toolbar = new SourceToolbarView().render();
        this.initialScrollTo = options.initialScrollTo;
        this.isEditable = options.isEditable || false;
        this.isShowingHighlights = (
            options.showHighlightsInitially ||
            this.initialScrollTo != null ||
            false
        );

        if (this.isShowingHighlights) {
            this.toggleToolbarItemSelected('annotations');
        } else {
            this.hideHighlights();
        }

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
        const text = this.model.get(schema.text);
        if (text && text.length) {
            this._createHtv(text[0] as string);
        } else {
            // Traversing the JSON serialization, instead of a regular
            // `model.get`, because the URI dereferences to plain text instead
            // of a RDF-formatted resource and this would trip up the
            // `Store.obtain()` call. TODO: replace this with a nicer API,
            // perhaps `model.getRaw()`.
            $.get(
                this.model.toJSON()[vocab('fullText')][0]['@id'] as string
            ).then(this._createHtv.bind(this));
        }
    }

    validate() {
        if (this.model == undefined) {
            throw RangeError("model cannot be undefined");
        }
        if (!isType(this.model, vocab('Source'))) {
            throw new TypeError("model should be of type vocab('Source')");
        }
    }

    // Internal method that creates `this.htv` and then sets some other things
    // in motion that depend on it. This should be invoked only once; the
    // constructor ensures this.
    _createHtv(text: string): void {
        this.htv = new HighlightableTextView({
            text,
            collection: new SegmentCollection(this.collection),
            initialScrollTo: this.initialScrollTo,
            isEditable: this.isEditable
        }).on('textSelected', this.onTextSelected, this);
        this.bindToToolbarEvents(this.toolbar);
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
        return list;
    }

    renderContainer(): this {
        this.$el.html(this.template({
            title: this.model.get(schema('name'))[0]
        }));
        return this;
    }

    // TODO: share information between the panel and the toolbar using a model
    // and move all responsibility for the appearance and behaviour of the
    // toolbar to the toolbar.
    bindToToolbarEvents(toolbar: SourceToolbarView): SourceToolbarView {
        this.listenTo(toolbar, 'highlightClickingMode', this.htv.disablePointerEvents);
        this.listenTo(toolbar, 'highlightTextSelectionMode', this.htv.enablePointerEvents);
        return toolbar;
    }

    /**
     * Pass events from HighlightableTextView
     */
    onTextSelected(range: Range, posDetails: AnnotationPositionDetails): void {
        this.trigger('sourceview:textSelected', this, this.model, range, posDetails);
    }

    /**
     * Toggle highlights on and off.
     */
    toggleHighlights(): this {
        if (this.isShowingHighlights) {
            this.hideHighlights();
            this.trigger('sourceview:hideAnnotations', this);
        }
        else {
            this.showHighlights();
            this.trigger('sourceview:showAnnotations', this, true);
        }
        this.toggleToolbarItemSelected('annotations');
        this.isShowingHighlights = !this.isShowingHighlights;
        return this;
    }

    // TODO: share information between the panel and the toolbar using a model
    // and move all responsibility for the appearance and behaviour of the
    // toolbar to the toolbar.
    toggleToolbarItemSelected(name: string): this {
        this.$(`.toolbar-${name}`).toggleClass("is-active");
        return this;
    }

    showHighlights(): this {
        this.toggleCategories();
        return this;
    }

    hideHighlights(): this {
        this.toggleCategories([]);
        return this;
    }

    toggleMetadata(): this {
        if (this.isShowingMetadata) {
            this.trigger('sourceview:hideMetadata', this, this.model);
        } else {
            this.trigger('sourceview:showMetadata', this, this.model);
        }
        this.isShowingMetadata = !this.isShowingMetadata;
        this.toggleToolbarItemSelected('metadata');

        return this;
    }

    toggleViewMode(): this {
        // TODO: update when full screen modal is implemented
        if (this.isInFullScreenViewMode) this.trigger('sourceView:shrink', this);
        else this.trigger('sourceView:enlarge', this);
        this.isInFullScreenViewMode = !this.isInFullScreenViewMode;
        this.toggleToolbarItemSelected('viewmode');
        return this;
    }

    toggleHighlightMode(): this {
        this.isInHighlightClickingMode = !this.isInHighlightClickingMode;
        return this;
    }

    scrollTo(annotation: FlatModel): void {
        this.htv.scrollTo(annotation);
    }
}
export default SourcePanel;

extend(SourcePanel.prototype, ToggleMixin.prototype, {
    className: 'source explorer-panel',
    template: sourceTemplate,
    events: {
        'click .toolbar-metadata': 'toggleMetadata',
        'click .toolbar-annotations': 'toggleHighlights',
        'click .toolbar-viewmode': 'toggleViewMode',
    }
});
