import { extend } from 'lodash';
import * as _ from 'underscore';
import View from '../core/view';
import Collection from '../core/collection';

import annotateTemplate from './annotate-template';
import NewAnnotationView from './new-annotation-view';
import FragmentView from './../fragment/fragment-view'
import CategoryCollection from '../models/category-collection';
import Category from '../models/category';
import Snippet from './../models/snippet';
import Fragment from '../models/fragment';
import Item from '../models/item';

export default class AnnotateView extends View {
    /**
     * The available categories to annotate with
     */
    annotationCategoriesCollection: CategoryCollection;

    /**
     * Category selected (on the modal). 
     * This property helps control what part is visible on the modal
     */
    selectedCategory: any;

    /**
     * Keep track of modal visibility
     */
    modalIsVisible: boolean = false;

    /**
     * The fragment being annotated
     */
    fragment: Fragment;

    /**
     * The current selection
     */
    currentSelection: Selection;


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
            fragment: this.fragment,
            annotatedText: this.annotatedText,
            selectedCategory: this.selectedCategory,
            categories: this.annotationCategoriesCollection.models
        }));

        // let fragmentView = new FragmentView({model: this.fragment});
        // fragmentView.render().$el.appendTo(this.$("#fragmentWrapper"));

        if (this.modalIsVisible) {
            this.showModal();
        }

        return this;
    }

    initialize(): void {
        this.fragment = new Fragment({ text: this.getP1(), snippets: [] });

        this.originalText = this.getP1();

        // let annotables = []
        // for (let able of this.originalText.split(' ')) {
        //     if (able) annotables.push(`<able>${able}</able>`)
        // }
        this.annotatedText = this.getP1();


        var self = this;
        var acCollection = new CategoryCollection();

        acCollection.fetch({
            data: { 'TODO': 'TODO' },
            success: function (collection, response, options) {
                self.annotationCategoriesCollection = new CategoryCollection(collection.models)
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

        this.range = range
        this.showModal();
    }

    onCategorySelected(event: any) {
        let categoryId = event.currentTarget.id;
        this.selectedCategory = this.annotationCategoriesCollection.get(categoryId);
        this.hideModal();

        // if (!this.currentSnippet.items) this.currentSnippet.items = [];
        // this.currentSnippet.items.push(new Item({ category: this.selectedCategory }));

        // this.render()
    }

    onReturnToCategories(): void {
        this.selectedCategory = undefined;
        this.render();
    }

    showModal() {
        this.modalIsVisible = true;
        this.$('#modalContainer').addClass('is-active');
    }

    hideModal() {
        this.modalIsVisible = false;
        this.$('#modalContainer').removeClass('is-active');

        if (this.selectedCategory) {
            let selectedSelectables = this.range.extractContents();
            let anno = document.createElement("anno");
            anno.classList.add(`${this.selectedCategory.attributes.class}`);
            anno.appendChild(selectedSelectables);

            for (let c of anno.childNodes) {
                // TODO: deal with anno in selected anno
                // if (c.nodeName == "ANNO") {

                // }
                //  TODO: somehow ensure we only have complete <able> tags (incl. inner spaces)?
                // console.log(c.nodeName)
            }

            this.range.insertNode(anno)

            // remove selection
            this.selectedCategory = undefined;
        }
    }

    insertClass(original: string, startIndex: number, endIndex, className): string {
        let textToReplace = original.substring(startIndex, endIndex);
        let replacement = `<span class="tag-${className}">${textToReplace}</span>`;
        return original.substr(0, startIndex) + replacement + original.substr(startIndex + textToReplace.length);
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
        'click .category': 'onCategorySelected',
        'click #returnToCategories': 'onReturnToCategories'
    }
});
