import { extend, map } from 'lodash';

import { CompositeView } from '../core/view';
import Subject, { isSubject } from '../common-rdf/subject';
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

export default class ExternalResourcesView extends CompositeView<Subject> {
    initialize() {
        this.render().listenTo(this.model, 'change', this.render);
        this.on('announceRoute', announce);
    }

    renderContainer(): this {
        const model = this.model;
        const externalResources = map(externalAttributes, attribute => {
            if (!model.has(attribute)) return;
            return {
                label: getLabelFromId(attribute),
                urls: map(
                    model.get(attribute),
                    url => isSubject(url) ? url.id : url
                ),
            }
        });
        this.$el.html(this.template({
            externalResources,
            itemSerial: getLabelFromId(model.id as string),
        }));
        return this;
    }

    onEditButtonClicked(event: JQuery.TriggeredEvent): void {
        explorerChannel.trigger('externalItems:edit', this);
    }
}

extend(ExternalResourcesView.prototype, {
    className: 'related-items explorer-panel',
    template: externalResourcesTemplate,
    subviews: [],
    events: {
        'click .btn-edit': 'onEditButtonClicked',
    },
});
