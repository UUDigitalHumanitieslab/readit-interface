import { extend, map } from 'lodash';

import { CompositeView } from '../core/view';
import Node, { isNode } from '../common-rdf/node';
import { rdfs, owl } from '../common-rdf/ns';
import explorerChannel from '../explorer/explorer-radio';
import { announceRoute } from '../explorer/utilities';
import LabeledIRIView from '../iri-hyperlink/labeled-iri-view';
import { getLabelFromId } from '../utilities/linked-data-utilities';

import externalResourcesTemplate from './external-resources-template';

const externalAttributes = [
    rdfs.seeAlso,
    owl.sameAs
];

const announce = announceRoute('item:external', ['model', 'id']);

export default class ExternalResourcesView extends CompositeView<Node> {
    itemLink: LabeledIRIView;

    initialize() {
        this.itemLink = new LabeledIRIView({ model: this.model });
        this.render().listenTo(this.model, 'change', this.render);
        this.on('announceRoute', announce);
    }

    renderContainer(): this {
        const externalResources = map(externalAttributes, attribute => {
            if (!this.model.has(attribute)) return;
            return {
                label: getLabelFromId(attribute),
                urls: map(
                    this.model.get(attribute),
                    url => isNode(url) ? url.id : url
                ),
            }
        });
        this.$el.html(this.template({ externalResources }));
        return this;
    }

    onEditButtonClicked(event: JQuery.TriggeredEvent): void {
        explorerChannel.trigger('externalItems:edit', this);
    }
}

extend(ExternalResourcesView.prototype, {
    className: 'related-items explorer-panel',
    template: externalResourcesTemplate,
    subviews: [{
        view: 'itemLink',
        selector: '.panel-header .subtitle',
    }],
    events: {
        'click .btn-edit': 'onEditButtonClicked',
    },
});
