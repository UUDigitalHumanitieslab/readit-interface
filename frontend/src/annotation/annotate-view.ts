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
     * The available categories to annotate with
     */
    annotationCategoriesCollection: CategoryCollection;

    /**
     * Keep track of modal visibility
     */
    modalIsVisible: boolean = false;
   
    /**
     * The snippet currently being categorized
     */
    currentSnippet: Snippet;

    originalText: string;
    annotatedText: string;
    selectedSelectables: DocumentFragment;

    range: any;

    render(): View {        
        this.$el.html(this.template({
            annotatedText: this.annotatedText
        }));

        let categoryPickerView = new CategoryPickerView();
        categoryPickerView.render().$el.appendTo(this.$('.modal-card-body'));
        categoryPickerView.on('categorySelected', this.onCategorySelected, this);
        
        // let fragmentView = new FragmentView({model: this.fragment});
        // fragmentView.render().$el.appendTo(this.$("#fragmentWrapper"));

        if (this.modalIsVisible) {
            this.showModal();
        }

        return this;
    }

    initialize(): void {
        this.originalText = this.getP1();
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

    showModal() {
        this.modalIsVisible = true;
        this.$('#modalContainer').addClass('is-active');
    }

    hideModal() {
        this.modalIsVisible = false;
        this.$('#modalContainer').removeClass('is-active');
    }

    onCategorySelected(selectedCategory: Category): void {
        let annoView = new AnnotationView(this.range, selectedCategory.attributes.class);         
        annoView.render();
        this.hideModal();
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

    getP2(): string {
        return "Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem \
        neque sed ipsum. Nam quam nunc, blandit vel, luctus pulvinar, hendrerit id, lorem. Maecenas nec odio et ante \
        tincidunt tempus. Donec vitae sapien ut libero venenatis faucibus. Nullam quis ante. Etiam sit amet orci eget \
        eros faucibus tincidunt. Duis leo. Sed fringilla mauris sit amet nibh. Donec sodales sagittis magna. Sed \
        consequat, leo eget bibendum sodales, augue velit cursus nunc, quis gravida magna mi a libero. Fusce vulputate \
        eleifend sapien. Vestibulum purus quam, scelerisque ut, mollis sed, nonummy id, metus. Nullam accumsan lorem in \
        dui. Cras ultricies mi eu turpis hendrerit fringilla. Vestibulum ante ipsum primis in faucibus orci luctus et \
        ultrices posuere cubilia Curae; In ac dui quis mi consectetuer lacinia."
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
