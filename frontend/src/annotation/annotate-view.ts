import { extend } from 'lodash';
import * as _ from 'underscore';
import View from '../core/view';
import Model from '../core/model';

import annotateTemplate from './annotate-template';
import AnnotationView from './annotation-view';
import CategoryPickerView from './category-picker';
import Category from '../models/category';

import Annotation from '../models/annotation';
import Source from '../models/source';


export default class AnnotateView extends View {
    /**
     * Keep track of modal visibility
     */
    categoryPickerIsVisible: boolean = false;

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
    
    constructor(private source: Source) {
        super();
        this.annotatedText = source.get('text');
    }

    render(): View {
        this.$el.html(this.template({
            annotatedText: this.annotatedText,
        }));

        if (this.categoryPickerIsVisible) {
            this.showCategoryPicker();
        }

        return this;
    }

    initialize(): void {
        this.categoryPickerView = new CategoryPickerView();
        this.categoryPickerView.on('categorySelected', this.onCategorySelected, this);
    }

    renderInParent(parent: any) {
        this.render().$el.appendTo(parent);
        this.initAnnotationViews();
    }

    onTextSelected(event: any): void {
        let selection = window.getSelection();
        let range = selection.getRangeAt(0).cloneRange();

        // no text selected, no modal
        if (range.startOffset === range.endOffset) return;

        // save selected range for future reference (i.e. on modal close)
        this.range = range;
        this.showCategoryPicker();
    }

    initAnnotationViews(): View {
        let test = this.$('#test');
        let textNode = test.get(0).firstChild;

        for (let anno of this.source.annotations.models) {
            // create a 'virtual' range based on offsets to retrieve rects to draw
            let range = document.createRange();
            range.setStart(textNode, anno.get('startIndex'));
            range.setEnd(textNode, anno.get('endIndex'));
            this.initAnnotationView(range, this.$("#testWrapper"), `rit-${anno.get('category')}`);
        }

        return this;
    }

    initAnnotationView(range: Range, parent: JQuery<HTMLElement>, cssClass: string) {
        for (let rect of range.getClientRects()) {
            let annoView = new AnnotationView(rect, cssClass, parent.get(0).getBoundingClientRect().top, parent.get(0).getBoundingClientRect().left);
            annoView.render().$el.prependTo(parent);
        }
    }

    onCategorySelected(selectedCategory: Category, selectedAttribute: any): void {
        this.initAnnotationView(this.range, this.$('.test'), `rit-${selectedCategory.get('machineName')}`)
        this.hideCategoryPicker();

        let newAnno = new Annotation({
            startIndex: this.range.startOffset, 
            endIndex: this.range.endOffset, 
            category: selectedCategory.get('machineName'), 
            source: this.source.get('id')
        })
        this.source.annotations.add(newAnno);
        newAnno.save();
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

    backToList(): void {
        this.trigger('return');
    }
}
extend(AnnotateView.prototype, {
    tagName: 'div',
    template: annotateTemplate,
    events: {
        'mouseup .annotationWrapper': 'onTextSelected',
        'click #btn-back-to-list': 'backToList',
    }
});
