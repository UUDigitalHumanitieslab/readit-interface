import { extend } from 'lodash';
import * as _ from 'underscore';
import View from '../core/view';

import annotateTemplate from './annotate-template';
import AnnotationView from './annotation-view';
import CategoryPickerView from './category-picker';
import Category from '../models/category';
import Collection from '../core/collection';

import AnnotationCollection from '../models/annotation-collection';


export default class AnnotateView extends View {
    /**
     * Keep track of modal visibility
     */
    categoryPickerIsVisible: boolean = false;

    annotationCollection: AnnotationCollection;
    annotationViews: View[];

    /**
     * A string representing the text fragment, and 
     * which might contain the HTML tags to render an annotation
     */
    annotatedText: string;

    /**
     * Instance of the category picker view
     */
    categoryPickerView: CategoryPickerView;

    /**
     * Range object that holds the text selected by the user
     */
    range: Range;

    render(): View {
        this.$el.html(this.template({
            annotatedText: this.annotatedText,
        }));

        if (this.categoryPickerIsVisible) {
            this.showCategoryPicker();
        }

        this.trigger('render:after')

        return this;
    }

    initialize(): void {
        this.annotatedText = this.getP1();
        this.annotationViews = [];

        // TODO: don't do this if it is a new annotation session
        this.setAnnotations();
        this.categoryPickerView = new CategoryPickerView();
        this.categoryPickerView.on('categorySelected', this.onCategorySelected, this);
    }

    renderInParent(parent:any) {
        this.render().$el.appendTo(parent)
        this.initAnnotationViews();
    }

    setAnnotations(): void {
        var self = this;
        var annoCollection = new AnnotationCollection();

        annoCollection.fetch({
            data: { 'TODO': 'TODO' },
            success: function (collection, response, options) {
                self.annotationCollection = new AnnotationCollection(collection.models)
            },
            error: function (collection, response, options) {
                console.error(response)
                return null;
            }
        })
    }

    onTextSelected(event: any): void {
        let selection = window.getSelection();
        let range = selection.getRangeAt(0).cloneRange();

        // no text selected, no modal
        if (range.startOffset === range.endOffset) return;

        let selectedText = range.cloneContents().textContent;

        // save selected range for future reference (i.e. on modal close)
        this.range = range
        this.showCategoryPicker();
    }

    initAnnotationViews(): View {
        for (let anno of this.annotationCollection.models) {
            // create a 'virtual' range based on offsets to retrieve rects to draw
            let r = document.createRange();
            
            let test = this.$('#test'); 
                       

            r.setStart(test.get(0).firstChild, anno.attributes.startIndex)
            r.setEnd(test.get(0).firstChild, anno.attributes.endIndex)
            
            this.initAnnotationView(r, this.$('#testWrapper'), anno.attributes.class)
        }

        return this;
    }

    initAnnotationView(range: Range, parent: JQuery<HTMLElement>, cssClass: string) {
        for (let rect of range.getClientRects()) {
            let annoView = new AnnotationView(rect, cssClass);
            annoView.render().$el.prependTo(parent);
        }
    }

    onCategorySelected(selectedCategory: Category, selectedAttribute: any): void {
        this.initAnnotationView(this.range, this.$('.test'), selectedCategory.attributes.class)
        this.hideCategoryPicker();

        // TODO: do something with (i.e. save) the selected stuff
    }

    showCategoryPicker(): void {
        this.categoryPickerIsVisible = true;
        this.categoryPickerView.setSelection(this.range.cloneContents().textContent);
        this.categoryPickerView.render().$el.appendTo(this.$('.categoryPickerWrapper'));
    }

    hideCategoryPicker(): void {
        this.categoryPickerIsVisible = false;
        this.categoryPickerView.hide();
    }

    getP1(): string {
        return "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum \
        sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies \
        nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, \
        aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum \
        felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate \
        eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, \
        dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. \
        Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui."
    }
}
extend(AnnotateView.prototype, {
    tagName: 'section',
    className: 'section',
    template: annotateTemplate,
    events: {
        'mouseup .annotationWrapper': 'onTextSelected',
    }
});
