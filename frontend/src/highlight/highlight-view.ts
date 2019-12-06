
import { extend, minBy, sumBy, initial, last, defer } from 'lodash';

import { rdf } from './../jsonld/ns';
import Node from '../jsonld/node';
import HighlightRectView from './highlight-rect-view';
import { getCssClassName } from './../utilities/utilities';
import { AnnotationPositionDetails, getPositionDetails } from '../utilities/annotation/annotation-utilities';
import BaseAnnotationView, { ViewOptions as BaseOpt } from '../annotation/base-annotation-view';
import { getRange } from '../utilities/range-utilities';

export interface ViewOptions extends BaseOpt {
    /**
     * The oa:Annotation instance to create the highlight for.
     */
    model: Node;

    /**
     * The READ-IT specific cssClass to add to this rect.
     */
    cssClass: string;

    /**
     * The element containing the text (inc. HTML tags) that the gighlight should appear in.
     * Should be in the DOM.
     */
    textWrapper: JQuery<HTMLElement>;

    /**
     * The first positioned parent, i.e. with position relative, absolute or fixed,
     * relative to which the highlight will be positioned.
     */
    relativeParent: JQuery<HTMLElement>;

    /**
     * Specifies whether the highlight can be deleted. Defaults to false.
     */
    isDeletable: boolean;

    positionDetails?: AnnotationPositionDetails
}

export default class HighlightView extends BaseAnnotationView {
    cssClass: string;
    range: Range;
    positionDetails: AnnotationPositionDetails;
    textWrapper: JQuery<HTMLElement>;
    relativeParent: JQuery<HTMLElement>;
    isDeletable: boolean;
    rects: ClientRectList | DOMRectList;
    rectViews: HighlightRectView[];
    lastRect: HighlightRectView;

    startSelector: Node;
    endSelector: Node;
    callbackFn: any;

    constructor(options?: ViewOptions) {
        if (!options.textWrapper) throw TypeError("textWrapper cannot be null or undefined");
        if (!options.relativeParent) throw TypeError("relativeParent cannot be null or empty");
        if (!options.model && !options.positionDetails) throw TypeError("positionDetails and model cannot both be undefined");
        super(options);
    }

    initialize(options: ViewOptions): this {
        this.cssClass = options.cssClass;
        this.relativeParent = options.relativeParent;
        this.textWrapper = options.textWrapper;
        this.isDeletable = options.isDeletable || false;

        if (this.model) {
            this.listenTo(this, 'startSelector', this.processStartSelector);
            this.listenTo(this, 'endSelector', this.processEndSelector);
            this.listenTo(this, 'body:ontologyClass', this.processOntologyClass);
            this.listenTo(this.model, 'change', this.processModel);
            this.processModel(this.model);
        }
        else {
            this.positionDetails = options.positionDetails;
            this.processPositionDetails();
        }
        return this;
    }

    processModel(model: Node): this {
        super.processAnnotation(model);
        return this;
    }

    processOntologyClass(ontologyClass: Node): this {
        this.cssClass = getCssClassName(ontologyClass);
        if (this.rectViews) {
            this.rectViews.forEach(v => {
                v.newCssClass(this.cssClass);
            });
        }
        if (!this.rectViews && this.rects) this.initRectViews();
        return this;
    }

    processStartSelector(selector: Node): this {
        if (selector.has(rdf.value)) {
            this.startSelector = selector;
            this.processSelectors();
        }
        return this;
    }

    processEndSelector(selector: Node): this {
        if (selector.has(rdf.value)) {
            this.endSelector = selector;
            this.processSelectors();
        }
        return this;
    }

    processSelectors(): this {
        if (this.startSelector && this.endSelector) {
            this.positionDetails = getPositionDetails(this.startSelector, this.endSelector);
            this.processPositionDetails();
            if (this.callbackFn) {
                this.callbackFn();
                delete this.callbackFn;
            }
        }
        return this;
    }

    processPositionDetails(): this {
        this.range = getRange(this.textWrapper, this.positionDetails);
        this.rects = this.range.getClientRects();
        if (!this.rectViews && this.cssClass) this.initRectViews();
        this.render();
        this.trigger('positionDetailsProcessed', this);

        return this;
    }

    ensurePositionDetails(callback: any): void {
        if (this.positionDetails) {
            defer(callback);
        }
        this.callbackFn = callback;
    }

    render(): this {
        if (this.rectViews) {
            this.rectViews.forEach(v => v.$el.detach());
            this.$el.append(this.rectViews.map((view) => view.el));
            this.trigger('rendered');
        }
        return this;
    }

    createRectView(rect: ClientRect | DOMRect, scrollTop: number, isLast: boolean): HighlightRectView {
        if (isLast && !this.isDeletable) { isLast = false; }
        let hrv = new HighlightRectView({
            cssClass: this.cssClass,
            isLast: isLast
        });
        this.bindHrvEvents(hrv);
        return hrv.render().position(rect, this.relativeParent.offset(), scrollTop);
    }

    initRectViews() {
        const scrollTop = $(document).scrollTop().valueOf();
        this.rectViews = initial(this.rects).map(
            rect => this.createRectView(rect, scrollTop, false)
        );
        this.rectViews.push(this.createRectView(last(this.rects), scrollTop, true));
    }

    bindHrvEvents(hrv: HighlightRectView): this {
        hrv.on('clicked', this.onClick, this);
        hrv.on('hover', this.onHover, this);
        hrv.on('hoverEnd', this.onHoverEnd, this);
        hrv.on('delete', this.onDelete, this);
        return this;
    }

    select(): this {
        this.rectViews.forEach(v => v.select());
        return this;
    }

    unSelect(): this {
        this.rectViews.forEach(v => v.unSelect());
        return this;
    }

    getTop(): number {
        return minBy(this.rectViews, (hrv) => { return hrv.$el.offset().top }).$el.offset().top;
    }

    getHeight(): number {
        return sumBy(this.rectViews, (hrv) => { return hrv.$el.outerHeight() });
    }

    getBottom(): number {
        return this.getTop() + this.getHeight();
    }

    getText(): string {
        return this.range.cloneContents().textContent;
    }

    onHover() {
        if (this.isDeletable) {
            last(this.rectViews).showDeleteButton();
        }

        this.trigger('hover', this.model);
    }

    onHoverEnd() {
        last(this.rectViews).hideDeleteButton();
        this.trigger('hoverEnd', this.model);
    }

    onDelete() {
        // TODO: add proper screen for this
        var really = confirm("Really?");
        if (really) {
            this.$el.detach();
        }
        this.trigger('delete', this.model);
    }

    onClick(rect: ClientRect | DOMRect) {
        this.trigger('click', this, this.model);
    }
}
extend(HighlightView.prototype, {
    tagName: 'div',
    className: 'highlight',
});
