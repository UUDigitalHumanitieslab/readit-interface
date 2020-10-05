import { noop, each, includes } from 'lodash';

import Model from '../core/model';
import ldChannel from '../jsonld/radio';
import { rdf, dcterms, oa, vocab, readit, item } from '../jsonld/ns';
import Node from '../jsonld/node';
import { getLabel, getCssClassName } from '../utilities/utilities';
import fastTimeout from '../core/fastTimeout';

/**
 * Flag bitmasks for tracking completion of a flat annotation. For a quick
 * introduction to flags and bitmasks, see this Stack Overflow answer:
 * https://stackoverflow.com/questions/15317723/what-are-flags-and-bitfields#15317846
 * In addition, you may want to review JavaScript's bitwise operators:
 * https://developer.mozilla.org/nl/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators
 */
const F_ID       = 1;
const F_CSSCLASS = 1 << 1;
const F_LABEL    = 1 << 2;
const F_SOURCE   = 1 << 3;
const F_POS      = 1 << 4;
const F_TEXT     = 1 << 5;
const F_COMPLETE = F_ID | F_CSSCLASS | F_LABEL | F_SOURCE | F_POS | F_TEXT;

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

    annotation    = (original annotation)
    id            = @id
    class         = oa.hasBody (if ontology class)
    classLabel    = oa.hasBody (if ontology class) -> getLabel()
    cssClass      = oa.hasBody (if ontology class) -> getCssClassName()
    item          = oa.hasBody (if item)
    label         = oa.hasBody (if item) -> getLabel()
    source        = oa.hasTarget -> oa.hasSource
    startPosition = oa.hasTarget -> oa.hasSelector (if vocab.TextPositionSelector) -> oa.start
    endPosition   = oa.hasTarget -> oa.hasSelector (if vocab.TextPositionSelector) -> oa.end
    text          = oa.hasTarget -> oa.hasSelector (if oa.TextQuoteSelector) -> oa.exact
    prefix        = oa.hasTarget -> oa.hasSelector (if oa.TextQuoteSelector) -> oa.prefix
    suffix        = oa.hasTarget -> oa.hasSelector (if oa.TextQuoteSelector) -> oa.suffix
    creator       = dcterms.creator
    created       = dcterms.created

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

    // Private method for updating the completion bitfield.
    _setCompletionFlag(flag: number): void {
        this._completionFlags |= flag;
        if (this.complete) {
            this.trigger('complete', this, this.underlying);
            // After this, we never need to check the flags or trigger the
            // `'complete'` event again.
            this._setCompletionFlag = noop;
        }
    }

    /**
     * Unlike most `Model` subclasses, this one accepts an underlying `Node`
     * instead of an initial hash of attributes. Precondition: `annotation`
     * must be an instance of `oa.Annotation`.
     */
    constructor(node: Node, options?: any) {
        super({ id: node.id }, options);
        this.underlying = node;
        this._completionFlags = 0;
        node.when('@type', this.receiveTopNode, this);
    }

    setOptionalFirst(source: Node, sourceAttr: string, targetAttr: string): this {
        const value = source.get(sourceAttr);
        if (value) this.set(targetAttr, value[0]);
        return this;
    }

    receiveTopNode(node: Node): void {
        const id = node.id;
        this.set({ id });
        this.setOptionalFirst(node, dcterms.creator, 'creator');
        this.setOptionalFirst(node, dcterms.created, 'created');
        this._setCompletionFlag(F_ID);
        let missing;
        if (node.has('@type', oa.Annotation)) {
            this.receiveAnnotation(node);
        } else if (node.has('@type', oa.SpecificResource)) {
            this.receiveTarget(node);
            this._setCompletionFlag(F_CSSCLASS | F_LABEL);
        } else if (missing = this.receiveSelector(node)) {
            this._setCompletionFlag(missing | F_CSSCLASS | F_LABEL | F_SOURCE);
        } else {
            this._setCompletionFlag(this.receiveBody(node));
            this._setCompletionFlag(F_SOURCE | F_POS | F_TEXT);
        }
    }

    /**
     * Invoked once when the annotation is more than just a placeholder.
     */
    receiveAnnotation(annotation: Node): void {
        this.set({ annotation });
        this.updateBodies(annotation);
        this.listenTo(annotation, `change:${oa.hasBody}`, this.updateBodies);
        const target = annotation.get(oa.hasTarget)[0] as Node;
        target.when(oa.hasSelector, this.receiveTarget, this);
    }

    /**
     * Invoked every time oa.hasBody changes.
     */
    updateBodies(annotation: Node): void {
        const bodies = annotation.get(oa.hasBody) as Node[];
        each(bodies, body => body.when('@type', this.receiveBody, this));
        // An annotation can be complete without an item or even a class.
        if (bodies) {
            if (bodies.length < 2) this._setCompletionFlag(F_LABEL);
            if (bodies.length < 1) this._setCompletionFlag(F_CSSCLASS);
        } else {
            this._setCompletionFlag(F_LABEL | F_CSSCLASS);
        }
    }

    /**
     * Invoked once for each oa.hasBody when it is more than just a placeholder.
     * Returns the body bit flag that was *not* completed.
     */
    receiveBody(body: Node): number {
        const id = body.id;
        if (id.startsWith(readit())) return this.receiveClass(body);
        if (id.startsWith(item())) return this.receiveItem(body);
        // We can add another line like the above to add support for
        // preannotations.
    }

    /**
     * Invoked once when the class body is more than just a placeholder.
     */
    receiveClass(body: Node): number {
        this.set({
            class: body,
            classLabel: getLabel(body),
            cssClass: getCssClassName(body),
        });
        this._setCompletionFlag(F_CSSCLASS);
        return F_LABEL;
    }

    /**
     * Invoked once when the item body is more than just a placeholder.
     */
    receiveItem(body: Node): number {
        if (!this.has('annotation')) {
            // Bare item, so there is no containing annotation that has both a
            // class and an item as bodies. Fetch the class through the item
            // instead.
            const ontoUri = body.get('@type')[0] as string;
            const ontoClass = ldChannel.request('obtain', ontoUri) as Node;
            ontoClass.when('@type', this.receiveClass, this);
        }
        this.set({
            item: body,
            label: getLabel(body),
        });
        this._setCompletionFlag(F_LABEL);
        return 0;
    }

    /**
     * Invoked once when the target is more than just a placeholder.
     */
    receiveTarget(target: Node): void {
        const sources = target.get(oa.hasSource);
        if (sources && sources.length) {
            this.set('source', sources[0]);
            this._setCompletionFlag(F_SOURCE);
        }
        const selectors = target.get(oa.hasSelector) as Node[];
        each(selectors, selector => selector.when(
            '@type',
            this.receiveSelector,
            this
        ));
    }

    /**
     * Invoked once for each oa.hasSelector when it is more than just a
     * placeholder.
     * Returns the selector bit flag that was *not* completed.
     */
    receiveSelector(selector: Node): number {
        const type = selector.get('@type') as string[];
        if (includes(type, oa.TextPositionSelector)) {
            return this.receivePosition(selector);
        }
        if (includes(type, oa.TextQuoteSelector)) {
            return this.receiveText(selector);
        }
    }

    /**
     * Invoked once when the TextPositionSelector is more than just a
     * placeholder.
     */
    receivePosition(selector: Node): number {
        const start = selector.get(oa.start);
        const end = selector.get(oa.end);
        if (start && start.length && end && end.length) {
            this.set({
                startPosition: start[0],
                endPosition: end[0]
            });
            this._setCompletionFlag(F_POS);
        }
        return F_TEXT;
    }

    /**
     * Invoked once when the TextQuoteSelector is more than just a placeholder.
     */
    receiveText(selector: Node): number {
        this.setOptionalFirst(selector, oa.prefix, 'prefix');
        this.setOptionalFirst(selector, oa.suffix, 'suffix');
        const text = selector.get(oa.exact);
        if (text && text.length) {
            this.set({ text: text[0] });
            this._setCompletionFlag(F_TEXT);
        }
        return F_POS;
    }
}