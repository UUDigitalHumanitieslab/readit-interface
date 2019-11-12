import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from '../core/view';

import { oa, schema, vocab, readit } from '../jsonld/ns';
import Node from '../jsonld/node';
import ldChannel from '../jsonld/radio';

import { isType } from '../utilities/utilities';
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

    baseProcessModel(annotation: Node): this {
        let targets = annotation.get(oa.hasTarget);

        if (targets) {
            targets.forEach(n => {
                this.baseProcessTarget(n as Node);
                this.stopListening(n, 'change', this.baseProcessTarget);
                this.listenTo(n, 'change', this.baseProcessTarget);
            });
        }

        let bodies = annotation.get(oa.hasBody);
        if (bodies) {
            bodies.forEach(b => {
                this.stopListening(b, 'change', this.baseProcessBody);
                this.listenTo(b, 'change', this.baseProcessBody);
                this.baseProcessBody(b as Node);
            });
        }

        return this;
    }

    baseProcessTarget(target: Node): this {
        if (isType(target, oa.SpecificResource)) {
            let source = target.get(oa.hasSource)[0] as Node;
            this.stopListening(source, 'change', this.baseProcessSource);
            this.listenTo(source, 'change', this.baseProcessSource);
            this.baseProcessSource(source);

            let selectors: Node[] = target.get(oa.hasSelector) as Node[];
            for (let selector of selectors) {
                this.stopListening(selector, 'change', this.baseProcessSelector);
                this.listenTo(selector, 'change', this.baseProcessSelector);
                this.baseProcessSelector(selector);
            }
        }

        return this;
    }

    baseProcessBody(body: Node): this {
        if ((body.id as string).includes('ontology')) {
            this.trigger('body:ontologyClass', body);
        }
        else {
            this.trigger('body:ontologyInstance', body);
        }

        return this;
    }

    baseProcessSource(source: Node): this {
        this.trigger('source', source);
        return this;
    }

    baseProcessSelector(selector: Node): this {
        if (isType(selector, oa.TextQuoteSelector)) {
            this.trigger('textQuoteSelector', selector);
        }

        if (isType(selector, vocab('RangeSelector'))) {
            let startSelector = selector.get(oa.hasStartSelector)[0] as Node;
            this.stopListening(startSelector, 'change', this.baseProcessStartSelector);
            this.listenTo(startSelector, 'change', this.baseProcessStartSelector);
            this.baseProcessStartSelector(startSelector);

            let endSelector = selector.get(oa.hasEndSelector)[0] as Node;
            this.stopListening(endSelector, 'change', this.baseProcessEndSelector);
            this.listenTo(endSelector, 'change', this.baseProcessEndSelector);
            this.baseProcessEndSelector(endSelector);
        }

        return this;
    }

    baseProcessStartSelector(selector: Node): this {
        this.trigger('startSelector', selector);
        return this;
    }

    baseProcessEndSelector(selector: Node): this {
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
