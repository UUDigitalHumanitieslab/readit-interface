import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';

import View from '../../core/view';
import { oa, rdf } from '../../jsonld/ns';
import Node from '../../jsonld/node';
import Graph from '../../jsonld/graph';

import { getCssClassName } from './../utilities';
import HighlightableTextTample from './highlightable-text-template';
import HighlightView from './highlight-view';


export interface ViewOptions extends BaseOpt<Node> {
    text: string;

    /**
     * Collection of 'oa:Annotation' instances to be used as initial highlights
     */
    collection: Graph;

    /**
     * Specify whether the text should be editable.
     */
    isEditable: boolean;
}

/**
 * A View that enables highlighting in a given text.
 * Important note: each highlight is based on a Range.
 * As a consequence thereof, the coordinates (i.e. positions) of the
 * Range's rectangles can only be correctly calculated AFTER this View
 * is inserted into the DOM. It listens for that event itself, but keep it in mind.
 */
export default class HighlightableTextView extends View {
    text: string;

    /**
     * Collection of 'oa:Annotation' instances to be used as initial highlights
     */
    collection: Graph;

    /**
     * Specify whether the text should be editable.
     */
    isEditable: boolean;

    // TODO: add scrollTo?

    constructor(options?: ViewOptions) {
        super(options);
        this.text = options.text;
        this.isEditable = options.isEditable;
    }

    render(): this {
        this.$el.html(this.template({ text: this.text }));
        return this;
    }

    insertedIntoDOM(): this {
        this.initHighlights();
        return this;
    }

    initHighlights(): this {
        if (this.text) {
            this.collection.each(( node ) => {
                if (node.get('@type') == oa.Annotation) {
                    this.addHighlight(node);
                }
            });
        }

        return this;
    }

    addHighlight(node: Node): this {
        let textWrapper = this.$('.textWrapper');

        // annotation styling details
        let body = this.getNode(node.get(oa.hasBody)[0]['@id']);
        let cssClass = getCssClassName(body);

        // annotation position details
        let selector = this.getNode(node.get(oa.hasTarget)[0]['@id']);
        let startSelector = this.getNode(selector.get(oa.hasStartSelector)[0]['@id']);
        let endSelector = this.getNode(selector.get(oa.hasEndSelector)[0]['@id']);

        let range = this.getRange(
            textWrapper,
            this.getNodeIndex(startSelector),
            this.getCharacterIndex(startSelector),
            this.getNodeIndex(endSelector),
            this.getCharacterIndex(endSelector)
        );
        let annoView = new HighlightView({
            model: node,
            range: range,
            cssClass: cssClass,
            relativeParent: this.$el,
            isDeletable: this.isEditable
        });
        annoView.render().$el.prependTo(this.$el);
        return this;
    }

    bindHvEvents(hV: HighlightView): this {
        hV.on('hover', this.onHover, this);
        hV.on('hoverEnd', this.onHoverEnd, this);
        hV.on('delete', this.onDelete, this);
        hV.on('clicked', this.onClicked, this);
        return this;
    }

    onHover(node: Node): this {
        this.trigger('hover', node);
        return this;
    }

    onHoverEnd(node: Node): this {
        this.trigger('hoverEnd', node);
        return this;
    }

    onDelete(node: Node): this {
        this.trigger('delete', node);
        return this;
    }

    onClicked(node: Node): this {
        this.trigger('clicked', node);
        return this;
    }

    getNode(id: string): Node {
        return this.collection.find(n => n.get('@id') === id);
    }

    getNodeIndex(selector: Node): number {
        let xpath = selector.get(rdf.value);
        let index = xpath.indexOf('[') + 1;
        return +xpath.substring(index, index + 1);
    }

    getCharacterIndex(selector: Node): any {
        let xpath = selector.get(rdf.value);
        let startIndex = xpath.indexOf(',') + 1
        let endIndex = xpath.length - 1;
        return xpath.substring(startIndex, endIndex);
    }

    getRange(
        textWrapper: JQuery<HTMLElement>,
        startContainerIndex: number,
        startIndex: number,
        endContainerIndex: number,
        endIndex: number
    ): Range {
        let range = document.createRange();
        let startContainer = textWrapper.contents().eq(startContainerIndex).get(0);
        let endContainer = textWrapper.contents().eq(endContainerIndex).get(0);
        range.setStart(startContainer, startIndex);
        range.setEnd(endContainer, endIndex);
        return range;
    }

    onTextSelected(event: any): void {
        if (!this.isEditable) return;

        let selection = window.getSelection();
        let range = selection.getRangeAt(0).cloneRange();

        // Ignore empty selections
        if (range.startOffset === range.endOffset) return;

        // TODO: throw event with selection (perhaps in annotation format)
        alert('Did you just select text???');
    }
}
extend(HighlightableTextView.prototype, {
    tagName: 'highlightable-text',
    className: 'highlightable-text',
    template: HighlightableTextTample,
    events: {
        'DOMNodeInsertedIntoDocument': 'insertedIntoDOM',
        'mouseup': 'onTextSelected',
    }
});
