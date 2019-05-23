import { extend } from 'lodash';
import View from '../../../core/view';

import SourceView from '../../../source/source-view';
import LdItemView from './../../../ld-item/ld-item-view';

import Node from './../../../jsonld/node';
import { JsonLdObject } from './../../../jsonld/json';

export default class ExplorerView extends View {

    render(): View {
        this.setHeight();
        let sourceView = new SourceView();
        sourceView.render().$el.appendTo(this.$el);

        let attributes: JsonLdObject = {
            '@id': 'uniqueID',
            'skos:prefLabel': [
                { '@value': 'Content' },
            ],
            "@type": [
                { '@id': "rdfs:Class" }
            ],
            "owl:sameAs": [
                { '@id': "http://www.wikidata.org/entity/Q331656" }
            ],
            "creator": [
               { '@id': "staff:JdeKruif" },
            ],
            "created": [
                { '@value': "2085-12-31T04:33:16+0100" }
            ],
            "readit:Title": [
                { '@value': 'Pretty Little Title' }
            ],
            'skos:definition': [
                { '@value': 'Dit is de definitie van content' },
            ]
        }
        let node = new Node(attributes);

        let ldiView = new LdItemView({ model: node });
        ldiView.render().$el.appendTo(this.$el);

        return this;
    }

    setHeight(): void {
        let vh = $(window).height();
        let height = vh - 242 > 555 ? vh - 242 : 555; // where 242 compensates for menu and footer
        this.$el.css('height', height);
    }
}
extend(ExplorerView.prototype, {
    tagName: 'div',
    className: 'explorer',
    events: {
    }
});
