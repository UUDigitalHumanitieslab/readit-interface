import { noop, each, includes, throttle } from 'lodash';

import Model from '../core/model';
import { skos, dcterms, oa, item, vocab } from '../common-rdf/ns';
import ldChannel from '../common-rdf/radio';
import Node from '../common-rdf/node';
import {
    getLabel,
    getCssClassName,
    isBlank,
    isRdfsClass,
    isRdfProperty,
} from '../utilities/linked-data-utilities';

/**
 * Flag bitmasks for tracking completion of a flat annotation. For a quick
 * introduction to flags and bitmasks, see this Stack Overflow answer:
 * https://stackoverflow.com/questions/15317723/what-are-flags-and-bitfields#15317846
 * In addition, you may want to review JavaScript's bitwise operators:
 * https://developer.mozilla.org/nl/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators
 */
const F_ID = 1 << 0;
const F_CLASS = 1 << 1;
const F_LABEL = 1 << 2;
const F_SOURCE = 1 << 3;
const F_STARTPOS = 1 << 4;
const F_ENDPOS = 1 << 5;
const F_POS = F_STARTPOS | F_ENDPOS;
const F_TEXT = 1 << 6;
const F_TARGET = F_SOURCE | F_POS | F_TEXT;
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
        this.on('change:creator', this.updateCreator);
        this.trackProperty(node, '@id', 'id');
        this.trackProperty(node, dcterms.creator, 'creator');
        this.trackProperty(node, dcterms.created, 'created');
        node.when('@type', this.receiveTopNode, this);
        this.getFilterClasses = throttle(this.getFilterClasses);
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
        // Below, each branch marks particular flags as completed in advance. We
        // do this because we don't expect the corresponding attributes to be
        // fulfilled, given the type of the top node.
        if (node.has('@type', oa.Annotation)) {
            this.set('annotation', node);
            // Initially assume an annotation without bodies.
            this._setCompletionFlag(F_CLASS | F_LABEL);
        } else if (node.has('@type', oa.SpecificResource)) {
            this.set('target', node);
            this._setCompletionFlag(F_COMPLETE ^ F_TARGET);
        } else if (node.has('@type', oa.TextPositionSelector)) {
            this.set('positionSelector', node);
            this._setCompletionFlag(F_COMPLETE ^ F_POS);
        } else if (node.has('@type', oa.TextQuoteSelector)) {
            this.set('quoteSelector', node);
            this._setCompletionFlag(F_COMPLETE ^ F_TEXT);
        } else if (isRdfsClass(node) || isRdfProperty(node)) {
            this.set('class', node);
            this._setCompletionFlag(F_COMPLETE ^ F_CLASS);
        } else {
            this.set('item', node);
            // Bare item, retrieve the class through the item.
            node.when('@type', this.receiveItemClass, this);
            this._setCompletionFlag(F_TARGET);
        }
    }

    /**
     * Special case for obtaining the class when `this.underlying` is a bare
     * item.
     */
    receiveItemClass(itemBody: Node, [ontoUri]: string[]): void {
        this.set('class', ldChannel.request('obtain', ontoUri));
    }

    /**
     * Standard update logic when one of the intermediate nodes changes.
     */
    rotateNode(
        attribute: string, dependents: string[],
        newNode: Node, unsetFlags: number
    ): this {
        const oldNode = this.previous(attribute);
        if (oldNode) this.stopListening(oldNode);
        if (newNode) {
            this._unsetCompletionFlag(unsetFlags);
        } else {
            each(dependents, this.unset.bind(this));
        }
        return this;
    }

    /**
     * Invoked when the `annotation` attribute changes.
     */
    updateAnnotation(flat: this, annotation: Node): void {
        this.rotateNode('annotation', ['class', 'item', 'target'], annotation, 0);
        if (annotation) {
            annotation.whenever(oa.hasBody, this.updateBodies, this);
            this.trackProperty(annotation, oa.hasTarget, 'target');
            this.trackProperty(annotation, vocab.needsVerification, 'needsVerification');
        }
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
        if (id && id.startsWith(item())) return this.set('item', body);
        // We can add another line like the above to add support for
        // preannotations.
        return this.set('class', body);
    }

    /**
     * Invoked when the `class` attribute changes.
     */
    updateClass(flat: this, classBody: Node): void {
        this.rotateNode('class', [
            'classLabel', 'cssClass', 'relatedClass',
        ], classBody, F_CLASS);
        if (classBody) {
            this.trackProperty(classBody, skos.related, 'relatedClass');
            this.listenTo(classBody, 'change', this.updateClassLabels);
            this.updateClassLabels(classBody);
        }
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
     * Invoked when the `item` attribute changes.
     */
    updateItem(flat: this, itemBody: Node): void {
        this.rotateNode('item', ['label'], itemBody, F_LABEL);
        if (itemBody) {
            this.listenTo(itemBody, 'change', this.updateItemLabel);
            this.updateItemLabel(itemBody);
        }
    }

    /**
     * Invoked when the attributes of the `item` change.
     */
    updateItemLabel(itemBody: Node): void {
        this.set({ label: getLabel(itemBody) });
    }

    /**
     * Invoked when the `target` attributes changes.
     */
    updateTarget(flat: this, target: Node): void {
        this.rotateNode('target', [
            'source', 'positionSelector', 'quoteSelector',
        ], target, F_TARGET);
        if (target) {
            this.trackProperty(target, oa.hasSource, 'source');
            target.whenever(oa.hasSelector, this.updateSelectors, this);
        }
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
     * Invoked when the `positionSelector` attribute changes.
     */
    updatePosition(flat: this, selector: Node): void {
        this.rotateNode('positionSelector', [
            'startPosition', 'endPosition',
        ], selector, F_POS);
        if (selector) {
            this.trackProperty(selector, oa.start, 'startPosition');
            this.trackProperty(selector, oa.end, 'endPosition');
        }
    }

    /**
     * Invoked when the `quoteSelector` attribute changes.
     */
    updateText(flat: this, selector: Node): void {
        this.rotateNode('quoteSelector', [
            'prefix', 'suffix', 'text',
        ], selector, F_TEXT);
        if (selector) {
            this.trackProperty(selector, oa.prefix, 'prefix');
            this.trackProperty(selector, oa.suffix, 'suffix');
            this.trackProperty(selector, oa.exact, 'text');
        }
    }

    /**
     * Invoked every time the `creator` attribute changes.
     */
    updateCreator(flat: this, creator?: Node): void {
        if (!creator) {
            this.set('isOwn', false);
            return;
        }
        const userURI = ldChannel.request('current-user-uri');
        this.set('isOwn', creator.id === userURI);
    }

    /**
     * Produce an array of CSS class names that match this annotation.
     * This can be used in views for filtering annotations. This method is
     * throttled per tick; after the first invocation, subsequent invocations
     * within the same tick will use the memoized result from the first
     * invocation instead of recomputing the array.
     */
    getFilterClasses(): string[] {
        const classList = [];
        if (!this.get('annotation')) return classList;
        const cssClass = this.get('cssClass');
        if (!cssClass) return classList;
        classList.push(cssClass);
        if (cssClass.startsWith('is-nlp')) {
            classList.push('rit-is-nlp');
            return classList;
        }
        classList.push('rit-is-semantic');
        const needsVerification = this.get('needsVerification');
        classList.push(`rit-${needsVerification ? 'un' : ''}verified`);
        const isOwn = this.get('isOwn');
        if (isOwn != null) {
            classList.push(`rit-${isOwn ? 'self' : 'other'}-made`);
        }
        const relatedClass = this.get('relatedClass');
        if (relatedClass) {
            classList.push(getCssClassName(relatedClass));
        }
        return classList;
    }
}
