import { extend } from 'lodash';
import * as _ from 'underscore';
import View from '../core/view';

import annotateTemplate from './annotate-template';
import AnnotationView from './annotation-view';
import CategoryCollection from '../models/category-collection';
import Snippet from './../models/snippet';
import CategoryPickerView from './category-picker';
import Category from '../models/category';

export default class AnnotateView extends View {
    /**
     * Keep track of modal visibility
     */
    modalIsVisible: boolean = false;
    
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
            annotatedText: this.annotatedText
        }));
        
        this.categoryPickerView = new CategoryPickerView();
        this.categoryPickerView.render().$el.appendTo(this.$('.modal-card-body'));
        this.categoryPickerView.on('categorySelected', this.onCategorySelected, this);

        if (this.modalIsVisible) {
            this.showModal();
        }

        return this;
    }

    initialize(): void {
        this.annotatedText = this.getP1();
    }

    onTextSelected(event: any): void {
        let selection = window.getSelection();
        let range = selection.getRangeAt(0).cloneRange();

        // no text selected, no modal
        if (range.startOffset === range.endOffset) return;
        
        // save selected range for future reference (i.e. on modal close)
        this.range = range
        this.showModal();
    }
    
    onCategorySelected(selectedCategory: Category, selectedAttribute: any): void {
        // TODO: do something with (i.e. save) the selected stuff
        console.log(selectedCategory, selectedAttribute)
        let annoView = new AnnotationView(this.range, selectedCategory.attributes.class);         
        annoView.render();
        this.hideModal();
    }

    showModal() {
        this.categoryPickerView.resetTabs()
        this.modalIsVisible = true;
        this.$('#modalContainer').addClass('is-active');
    }

    hideModal() {
        this.modalIsVisible = false;
        this.$('#modalContainer').removeClass('is-active');
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
        'click .modal-close': 'hideModal',
        'click .modal-background': 'hideModal',        
    }
});
