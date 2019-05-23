import { extend, each } from 'lodash';
import View from '../core/view';

import ldItemTemplate from './ld-item-template';
import { getLabel } from '../utilities/utilities';
import Node from '../jsonld/node';

import LabelView from '../utilities/label-view';

import { JsonLdObject } from '../jsonld/json';
import { triggerAsyncId } from 'async_hooks';

export default class LdItemView extends View<Node> {

    properties: any = new Object();
    itemMetadata: any = new Object();
    annoMetadata: any = new Object();
    relatedItems: any = new Object();
    annotations: any;
    externalResources: any = new Object();

    render(): this {
        this.setItemProperties();

        this.$el.html(this.template(
            {
                label: getLabel(this.model),
                properties: this.properties,
                itemMetadata: this.itemMetadata,
                annoMetadata: this.annoMetadata,
                relatedItems: this.relatedItems,
                annotations: this.annotations,
                externalResources: this.externalResources
            }));


        let lblView = new LabelView({model: this.model}, false);
        lblView.render().$el.appendTo(this.$('#lblViewWrapper'));

        return this;
    }

    setItemProperties(): void {
        for (let attribute in this.model.attributes) {
            if (attribute == '@id' || attribute == '@type') {
                continue;
            }

            // iterate over the value for this attribute, which is an array of objects
            // that either contain a value (i.e. string or date or whatever) and look like
            //'{
            //    "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
            //    "@value": "2085-12-31T04:33:15+0100"
            // }'
            // or that represents a link to another item, which looks like
            // '{
            //    '@id': "http://www.wikidata.org/entity/Q331656"
            //}
            for (let index in this.model.get(attribute)) {

                let obj = this.model.attributes[attribute][index];

                // first extract everything specific that we need
                if (attribute == 'creator') {
                    this.itemMetadata[attribute] = obj['@id'];
                    continue;
                }

                if (attribute == 'created') {
                    this.itemMetadata[attribute] = obj['@value'];
                    continue;
                }

                if (attribute == 'owl:sameAs') {
                    this.externalResources[attribute] = obj['@id'];
                    continue;
                }

                // then process what is left
                if (obj['@value']) {
                    this.properties[attribute] = obj['@value'];
                    continue;
                }

                if (obj['@id']) {
                    this.relatedItems[attribute] = obj['@id'];
                    continue;
                }
            }
        }
    }

    onFakeBtnClicked(): void {
        this.trigger('fakeBtnClicked');
    }
}
extend(LdItemView.prototype, {
    tagName: 'div',
    className: 'ld-item explorer-panel',
    template: ldItemTemplate,
    events: {
        'click #fakeButton': 'onFakeBtnClicked',
    }
});
