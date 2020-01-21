import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from '../core/view';

import { oa, schema, vocab, readit } from '../jsonld/ns';
import Node from '../jsonld/node';
import ldChannel from '../jsonld/radio';

import { isType, isOntologyClass } from '../utilities/utilities';
import SnippetView from '../utilities/snippet-view/snippet-view';
import LabelView from '../utilities/label-view';

export interface ViewOptions extends BaseOpt<Node> {
    model: Node;
}

/**
 * Base class for Views processing an instance of oa:Annotation
 * and its tree of linked items. Triggers events if a certain
 * 'endpoint' is reached. For example, ('textQuoteSelector', item) - where
 * item is an instance of oa:TextQuoteSelector - will be triggered if
 * such an item is found.
 *
 * This view subscribes itself to change events in all intermediate items,
 * and processes them accordingly.
 */
export default abstract class BaseAnnotationView extends View<Node> {
    constructor(options: ViewOptions) {
        super(options);
    }

    render(): this {
        return this;
    }

    processAnnotation(annotation: Node): this {
        let targets = annotation.get(oa.hasTarget);

        if (targets) {
            targets.forEach(n => {
                this.processTarget(n as Node);
                // Stop listening in case we are already listening...
                // ... and then listen afresh. (i.e. prevent double event handling)
                this.stopListening(n, 'change', this.processTarget);
                this.listenTo(n, 'change', this.processTarget);
            });
        }

        let bodies = annotation.get(oa.hasBody);
        if (bodies) {
            bodies.forEach(b => {
                // Stop listening in case we are already listening...
                // ... and then listen afresh. (i.e. to prevent double event handling)
                this.stopListening(b, 'change', this.processBody);
                this.listenTo(b, 'change', this.processBody);
                this.processBody(b as Node);
            });
        }

        return this;
    }

    processTarget(target: Node): this {
        if (isType(target, oa.SpecificResource)) {
            let source = target.get(oa.hasSource)[0] as Node;
            // See comment above for explanation of stopListening/listenTo pattern.
            this.stopListening(source, 'change', this.processSource);
            this.listenTo(source, 'change', this.processSource);
            this.processSource(source);

            let selectors: Node[] = target.get(oa.hasSelector) as Node[];
            for (let selector of selectors) {
                // See comment above for explanation of stopListening/listenTo pattern.
                this.stopListening(selector, 'change', this.processSelector);
                this.listenTo(selector, 'change', this.processSelector);
                this.processSelector(selector);
            }
        }

        return this;
    }

    processBody(body: Node): this {
        if (isOntologyClass(body)) {
            this.trigger('body:ontologyClass', body);
        }
        else {
            this.trigger('body:ontologyInstance', body);
        }

        return this;
    }

    processSource(source: Node): this {
        this.trigger('source', source);
        return this;
    }

    processSelector(selector: Node): this {
        if (isType(selector, oa.TextQuoteSelector)) {
            this.trigger('textQuoteSelector', selector);
        }

        if (isType(selector, vocab('RangeSelector'))) {
            let startSelector = selector.get(oa.hasStartSelector)[0] as Node;
            // See comment above for explanation of stopListening/listenTo pattern.
            this.stopListening(startSelector, 'change', this.processStartSelector);
            this.listenTo(startSelector, 'change', this.processStartSelector);
            this.processStartSelector(startSelector);

            let endSelector = selector.get(oa.hasEndSelector)[0] as Node;
            // See comment above for explanation of stopListening/listenTo pattern.
            this.stopListening(endSelector, 'change', this.processEndSelector);
            this.listenTo(endSelector, 'change', this.processEndSelector);
            this.processEndSelector(endSelector);
        }

        return this;
    }

    processStartSelector(selector: Node): this {
        this.trigger('startSelector', selector);
        return this;
    }

    processEndSelector(selector: Node): this {
        this.trigger('endSelector', selector);
        return this;
    }
}
extend(BaseAnnotationView.prototype, {
    tagName: 'div',
    className: 'base-annotation',
    events: {
    }
});
