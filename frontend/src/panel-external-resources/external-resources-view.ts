import { extend } from 'lodash';

import View from '../core/view';
import Node from '../common-rdf/node';
import { rdfs, owl } from '../common-rdf/ns';
import explorerChannel from '../explorer/explorer-radio';
import { announceRoute } from '../explorer/utilities';
import { getLabelFromId } from '../utilities/linked-data-utilities';

import externalResourcesTemplate from './external-resources-template';

const externalAttributes = [
    rdfs.seeAlso,
    owl.sameAs
];

const announce = announceRoute('item:external', ['model', 'id']);

export default class ExternalResourcesView extends View<Node> {
    externalResources: {label: string, urls: string[]}[];

    initialize(): this {
        this.displayResources();
        this.model.on('change', this.displayResources, this);
        this.on('announceRoute', announce);
        return this;
    }

    render(): this {
        this.$el.html(this.template(this));
        return this;
    }

    displayResources(): this {
        this.externalResources = externalAttributes.map( attribute => {
            if (this.model.get(attribute) === undefined) {
                return;
            }
            return {
                label: getLabelFromId(attribute),
                urls: this.model.get(attribute) as string[]
            }
        });
        this.render();
        return this;
    }

    onEditButtonClicked(event: JQuery.TriggeredEvent): void {
        explorerChannel.trigger('externalItems:edit', this);
    }
}

extend(ExternalResourcesView.prototype, {
    tagName: 'div',
    className: 'related-items explorer-panel',
    template: externalResourcesTemplate,
    events: {
        'click .btn-edit': 'onEditButtonClicked',
    },
});
