import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from '../core/view';

import Graph from './../jsonld/graph';
import Node from '../jsonld/node';

import ldItemTemplate from './ld-item-template';

import { owl } from './../jsonld/ns';

import LabelView from '../utilities/label-view';

import * as bulmaAccordion from 'bulma-accordion';

export interface ViewOptions extends BaseOpt<Node> {
    ontology: Graph;
}

export default class LdItemView extends View<Node> {
    lblView: LabelView;
    ontology: Graph;

    label: string;
    properties: any = new Object();
    itemMetadata: any = new Object();
    annoMetadata: any = new Object();
    relatedItems: any = new Object();
    annotations: any;
    externalResources: any = new Object();

    render(): this {
        this.setItemProperties();
        this.lblView.$el.detach();
        this.$el.html(this.template(this));
        this.$('header aside').append(this.lblView.el)
        return this;
    }

    constructor(options?: ViewOptions) {
        super(options);

        if (!options.ontology) throw new TypeError('ontology cannot be null or undefined');
        let ontologyItem = options.ontology.get(this.model.get('@type')[0] as string);
        this.lblView = new LabelView({model: ontologyItem, hasTooltip: false});
        this.lblView.render();
    }

    setItemProperties(): void {
        for (let attribute in this.model.attributes) {
            if (attribute == '@id' || attribute == '@type') {
                continue;
            }

            // iterate over the value for this attribute, which is an array of objects
            // that either contain a value (i.e. string or date or whatever) and looks like
            //'{
            //    "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
            //    "@value": "2085-12-31T04:33:15+01:00"
            // }'
            // or that represents a link to another item, which looks like
            //'{
            //    '@id': "http://www.wikidata.org/entity/Q331656"
            // }'
            for (let index in this.model.get(attribute)) {

                let obj = this.model.attributes[attribute][index];

                // first extract everything specific that we need
                if (attribute == 'creator') {
                    this.itemMetadata[attribute] = obj.id;
                    continue;
                }

                if (attribute == 'created') {
                    this.itemMetadata[attribute] = obj;
                    continue;
                }

                if (attribute == owl.sameAs) {
                    this.externalResources[attribute] = obj.id;
                    continue;
                }

                // then process what is left
                if (obj instanceof Node) {
                    this.relatedItems[attribute] = obj.id;
                } else {
                    this.properties[attribute] = obj;
                }
            }
        }
    }

    onRelItemsClicked(): void {
        this.trigger('show:related', this.model);
    }

    onAnnotationsClicked(): void {
        this.trigger('show:annotations', this.model);
    }

    onExtResourcesClicked(): void {
        this.trigger('show:external', this.model);
    }
}
extend(LdItemView.prototype, {
    tagName: 'div',
    className: 'ld-item explorer-panel',
    template: ldItemTemplate,
    events: {
        'click #btnRelItems': 'onRelItemsClicked',
        'click #btnAnnotations': 'onAnnotationsClicked',
        'click #btnExtResources': 'onExtResourcesClicked',
    }
});
