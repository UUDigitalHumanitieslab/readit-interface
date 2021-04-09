import { noop, each, includes } from 'lodash';

import Model from '../core/model';
import { rdf, dcterms, oa, readit, item } from '../common-rdf/ns';
import ldChannel from '../common-rdf/radio';
import Node from '../common-rdf/node';
import {
    getLabel,
    getCssClassName,
    isBlank,
} from '../utilities/linked-data-utilities';

/**
 * Flag bitmasks for tracking completion of a flat annotation. For a quick
 * introduction to flags and bitmasks, see this Stack Overflow answer:
 * https://stackoverflow.com/questions/15317723/what-are-flags-and-bitfields#15317846
 * In addition, you may want to review JavaScript's bitwise operators:
 * https://developer.mozilla.org/nl/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators
 */
const F_ID       = 1 << 0;
const F_CLASS    = 1 << 1;
const F_LABEL    = 1 << 2;
const F_SOURCE   = 1 << 3;
const F_STARTPOS = 1 << 4;
const F_ENDPOS   = 1 << 5;
const F_POS      = F_STARTPOS | F_ENDPOS;
const F_TEXT     = 1 << 6;
const F_TARGET   = F_SOURCE | F_POS | F_TEXT;
const F_COMPLETE = F_ID | F_CLASS | F_LABEL | F_TARGET;

// Which flag is completed for each given mapped flat attribute.
const flagMapping = {
    id: F_ID,
    cssClass: F_CLASS,
    label: F_LABEL,
    source: F_SOURCE,
    startPosition: F_STARTPOS,
    endPosition: F_ENDPOS,
    text: F_TEXT,
};

/**
 * Adapter that transforms a `Node` representing an `oa.Annotation`s into a
 * flattened representation that is easier to process. Incomplete annotations
 * and unwrapped instances of node types that tend to be used as body or target
 * are supported as well. In this representation, each direct and indirect RDF
 * property of interest is mapped to a direct model attribute.
 *
 * Please keep in mind that this transform is one way only. In order to edit an
 * annotation, you have to walk the original RDF datastructure. However, the
 * flat representation will update live with any changes to the underlying data.
 *
 * The RDF properties are mapped to model attributes as follows:

    annotation       = (original annotation)
    id               = @id
    class            = oa.hasBody (if ontology class)
    classLabel       = oa.hasBody (if ontology class) -> getLabel()
    cssClass         = oa.hasBody (if ontology class) -> getCssClassName()
    item             = oa.hasBody (if item)
    label            = oa.hasBody (if item) -> getLabel()
    target           = oa.hasTarget
    source           = oa.hasTarget -> oa.hasSource
    positionSelector = oa.hasTarget -> oa.hasSelector (if vocab.TextPositionSelector)
    startPosition    = oa.hasTarget -> oa.hasSelector (if vocab.TextPositionSelector) -> oa.start
    endPosition      = oa.hasTarget -> oa.hasSelector (if vocab.TextPositionSelector) -> oa.end
    quoteSelector    = oa.hasTarget -> oa.hasSelector (if oa.TextQuoteSelector)
    text             = oa.hasTarget -> oa.hasSelector (if oa.TextQuoteSelector) -> oa.exact
    prefix           = oa.hasTarget -> oa.hasSelector (if oa.TextQuoteSelector) -> oa.prefix
    suffix           = oa.hasTarget -> oa.hasSelector (if oa.TextQuoteSelector) -> oa.suffix
    creator          = dcterms.creator
    created          = dcterms.created

 * For further processing convenience, the model triggers a `'complete'` event
 * when all of the following attributes have been collected: `id`, `cssClass`,
 * `label`, `source`, `startPosition`, `endPosition`, `text`. It also exposes a
 * read-only `complete` property which evaluates to `false` before the event
 * and `true` after the event. Attributes that are never expected to be set,
 * such as `startPosition` for a bare item, are intelligently skipped.
 */
export default class FlatItem extends Model {
    underlying: Node;

    // Private bitfield for tracking completion.
    _completionFlags: number;

    // Public read-only property to check for completion.
    get complete(): boolean {
        return this._completionFlags === F_COMPLETE;
    }

    // Private methods for updating the completion bitfield.
    _setCompletionFlag(flag: number): void {
        this._completionFlags |= flag;
        if (this.complete) {
            this.trigger('complete', this, this.underlying);
            // After this, we never need to check the flags or trigger the
            // `'complete'` event again.
            this._setCompletionFlag = noop;
            this._unsetCompletionFlag = noop;
        }
    }
    _unsetCompletionFlag(flag: number): void {
        this._completionFlags &= ~flag;
    }

    /**
     * Unlike most `Model` subclasses, this one accepts an underlying `Node`
     * instead of an initial hash of attributes. Precondition: `annotation`
     * must be an instance of `oa.Annotation`.
     */
    constructor(node: Node, options?: any) {
        super({}, options);
        this.underlying = node;
        // Track terminal completion.
        this._completionFlags = 0;
        each(flagMapping, (flag, attribute) => this.once(
            `change:${attribute}`,
            () => this._setCompletionFlag(flag)
        ));
        // Track intermediate nodes.
        this.on('change:annotation', this.updateAnnotation);
        this.on('change:class', this.updateClass);
        this.on('change:item', this.updateItem);
        this.on('change:target', this.updateTarget);
        this.on('change:positionSelector', this.updatePosition);
        this.on('change:quoteSelector', this.updateText);
        // Track changes in the top node.
        this.trackProperty(node, '@id', 'id');
        this.trackProperty(node, dcterms.creator, 'creator');
        this.trackProperty(node, dcterms.created, 'created');
        node.when('@type', this.receiveTopNode, this);
    }

    /**
     * Common update handling for (nested) properties for which we expect only
     * a single literal value.
     */
    trackProperty(source: Node, sourceAttr: string, targetAttr: string): this {
        source.whenever(
            sourceAttr,
            () => this.setOptionalFirst(source, sourceAttr, targetAttr),
            this
        );
        return this;
    }

    setOptionalFirst(source: Node, sourceAttr: string, targetAttr: string): this {
        const value = source.get(sourceAttr);
        if (value) {
            this.set(targetAttr, sourceAttr === '@id' ? value : value[0]);
        }
        return this;
    }

    /**
     * Invoked once when this.underlying has an `@type`.
     */
    receiveTopNode(node: Node): void {
        if (node.has('@type', oa.Annotation)) {
            this.receiveAnnotation(node);
        } else if (node.has('@type', oa.SpecificResource)) {
            this.receiveTarget(node);
        } else if (node.has('@type', oa.TextPositionSelector)) {
            this.receivePosition(node);
        } else if (node.has('@type', oa.TextQuoteSelector)) {
            this.receiveText(node);
        } else if (node.id.startsWith(readit())) {
            this.receiveClass(node);
        } else {
            this.receiveItem(node);
        }
    }

    /**
     * Invoked once when `this.underlying` proves to be an oa:Annotation.
     */
    receiveAnnotation(annotation: Node): void {
        this.set({ annotation });
        // Initially assume an annotation without bodies.
        this._setCompletionFlag(F_CLASS | F_LABEL);
    }

    /**
     * Invoked when the `annotation` attribute changes.
     */
    updateAnnotation(flat: this, annotation: Node): void {
        const oldAnnotation = this.previous('annotation');
        if (oldAnnotation) this.stopListening(oldAnnotation);
        if (!annotation) {
            this.unset('class').unset('item').unset('target');
            return;
        }
        annotation.whenever(oa.hasBody, this.updateBodies, this);
        this.trackProperty(annotation, oa.hasTarget, 'target');
    }

    /**
     * Invoked every time oa.hasBody changes.
     */
    updateBodies(annotation: Node): void {
        const bodies = annotation.get(oa.hasBody) as Node[];
        if (!includes(bodies, this.get('class'))) this.unset('class');
        if (!includes(bodies, this.get('item'))) this.unset('item');
        each(bodies, this.processBody.bind(this));
    }

    /**
     * Invoked once for each new oa.hasBody.
     */
    processBody(body: Node) {
        if (isBlank(body)) return this.set('item', body);
        const id = body.id;
        if (id.startsWith(readit())) return this.set('class', body);
        if (id.startsWith(item())) return this.set('item', body);
        // We can add another line like the above to add support for
        // preannotations.
    }

    /**
     * Invoked once when `this.underlying` proves to be an ontology class.
     */
    receiveClass(body: Node): void {
        this.set({ class: body });
        // Given that the top-level node is a class, we are never going to get
        // any of the other things, so mark them completed.
        this._setCompletionFlag(F_COMPLETE ^ F_CLASS);
    }

    /**
     * Invoked when the `class` attribute changes.
     */
    updateClass(flat: this, classBody: Node): void {
        const oldClassBody = this.previous('class');
        if (oldClassBody) this.stopListening(oldClassBody);
        if (!classBody) {
            this.unset('classLabel').unset('cssClass');
            return;
        }
        this._unsetCompletionFlag(F_CLASS);
        this.listenTo(classBody, 'change', this.updateClassLabels);
        this.updateClassLabels(classBody);
    }

    /**
     * Invoked when the attributes of the `class` change.
     */
    updateClassLabels(classBody: Node): void {
        this.set({
            classLabel: getLabel(classBody),
            cssClass: getCssClassName(classBody),
        });
    }

    /**
     * Invoked once when `this.underlying` proves to be a bare item.
     */
    receiveItem(itemBody: Node): void {
        this.set({ item: itemBody });
        // Bare item, retrieve the class through the item.
        itemBody.when('@type', this.receiveItemClass, this);
        // Bare item, don't expect any other properties so mark them completed.
        this._setCompletionFlag(F_TARGET);
    }

    /**
     * Special case for obtaining the class when `this.underlying` is a bare
     * item.
     */
    receiveItemClass(itemBody: Node, [ontoUri]: string[]): void {
        this.set('class', ldChannel.request('obtain', ontoUri));
    }

    /**
     * Invoked when the `item` attribute changes.
     */
    updateItem(flat: this, itemBody: Node): void {
        const oldItemBody = this.previous('item');
        if (oldItemBody) this.stopListening(oldItemBody);
        if (!itemBody) {
            this.unset('label');
            return;
        }
        this._unsetCompletionFlag(F_LABEL);
        this.listenTo(itemBody, 'change', this.updateItemLabel);
        this.updateItemLabel(itemBody);
    }

    /**
     * Invoked when the attributes of the `item` change.
     */
    updateItemLabel(itemBody: Node): void {
        this.set({ label: getLabel(itemBody) });
    }

    /**
     * Invoked once when `this.underlying` proves to be an oa:SpecificResource.
     */
    receiveTarget(target: Node): void {
        this.set('target', target);
        // Bare oa:SpecificResource, so mark the other things as complete.
        this._setCompletionFlag(F_COMPLETE ^ F_TARGET);
    }

    /**
     * Invoked when the `target` attributes changes.
     */
    updateTarget(flat: this, target: Node): void {
        const oldTarget = this.previous('target');
        if (oldTarget) this.stopListening(oldTarget);
        if (!target) {
            this.unset('source').unset('positionSelector')
                .unset('quoteSelector');
            return;
        }
        this._unsetCompletionFlag(F_TARGET);
        this.trackProperty(target, oa.hasSource, 'source');
        target.whenever(oa.hasSelector, this.updateSelectors, this);
    }

    /**
     * Invoked every time oa.hasSelector changes.
     */
    updateSelectors(target: Node): void {
        const selectors = target.get(oa.hasSelector) as Node[];
        each(['positionSelector', 'quoteSelector'], attr => {
            if (!includes(selectors, this.get(attr))) this.unset(attr);
        });
        each(selectors, selector => selector.when(
            '@type', this.processSelector, this
        ));
    }

    /**
     * Invoked once for each oa.hasSelector when it is more than just a
     * placeholder.
     */
    processSelector(selector: Node): void {
        if (selector.has('@type', oa.TextPositionSelector)) {
            this.set('positionSelector', selector);
        } else {
            this.set('quoteSelector', selector);
        }
    }

    /**
     * Invoked once when `this.underlying` proves to be an
     * oa:TextPositionSelector.
     */
    receivePosition(selector: Node): void {
        this.set('positionSelector', selector);
        // Bare position selector, mark the other things as complete.
        this._setCompletionFlag(F_COMPLETE ^ F_POS);
    }

    /**
     * Invoked once when the `positionSelector` attributes changes.
     */
    updatePosition(flat: this, selector: Node): void {
        const oldSelector = this.previous('positionSelector');
        if (oldSelector) this.stopListening(oldSelector);
        if (!selector) {
            this.unset('startPosition').unset('endPosition');
            return;
        }
        this._unsetCompletionFlag(F_POS);
        this.trackProperty(selector, oa.start, 'startPosition');
        this.trackProperty(selector, oa.end, 'endPosition');
    }

    /**
     * Invoked once when `this.underlying` proves to be an oa:TextQuoteSelector.
     */
    receiveText(selector: Node): void {
        this.set('quoteSelector', selector);
        this._setCompletionFlag(F_COMPLETE ^ F_TEXT);
    }

    /**
     * Invoked once when the `quoteSelector` attribute changes.
     */
    updateText(flat: this, selector: Node): void {
        const oldSelector = this.previous('quoteSelector');
        if (oldSelector) this.stopListening(oldSelector);
        if (!selector) {
            this.unset('prefix').unset('suffix').unset('text');
            return;
        }
        this._unsetCompletionFlag(F_TEXT);
        this.trackProperty(selector, oa.prefix, 'prefix');
        this.trackProperty(selector, oa.suffix, 'suffix');
        this.trackProperty(selector, oa.exact, 'text');
    }
}
