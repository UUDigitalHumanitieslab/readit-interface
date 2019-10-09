import View from './../core/view';
import { defer } from 'lodash';
import Node from './../jsonld/node';

import ExplorerView from './explorer-view';
import SourceView from '../panel-source/source-view';
import LdItemView from '../panel-ld-item/ld-item-view';
import Graph from '../jsonld/graph';
import AnnotationsView from '../annotation/panel-annotation-list-view';


import HighlightView from '../highlight/highlight-view';

export default class ExplorerEventController {
    /**
     * The explorer view instance to manage events for
     */
    explorerView: ExplorerView;

    constructor(explorerView: ExplorerView) {
        this.explorerView = explorerView;
    }

    /**
     * Subcribes to the events fired by the panel.
     * Contains a neat trick: will subscribe to all known events, most of which will never be
     * fired by the panel. No panel fires all different events.
     * @param panel The panel to listen to.
     */
    subscribeToPanelEvents(panel: View): void {
        panel.on({
            'sourceview:highlightSelected': this.sourceViewHighlightSelected,
            'sourceview:highlightUnselected': this.sourceViewHighlightUnselected,
            'sourceview:showMetadata': this.sourceViewShowMetadata,
            'sourceview:hideMetadata': this.sourceViewHideMetadata,
            'sourceview:showAnnotations': (graph) => defer(this.sourceViewShowAnnotations.bind(this), graph),
            'sourceview:hideAnnotations': this.sourceViewHideAnnotations,
            'sourceView:enlarge': this.sourceViewEnlarge,
            'sourceView:shrink': this.sourceViewShrink
        }, this);
    }

    sourceViewHighlightSelected(sourceView: View, annotation: Node): this {
        let itemView = new LdItemView({ model: annotation, ontology: this.explorerView.ontology });
        this.explorerView.push(itemView);
        return this;
    }

    sourceViewHighlightUnselected(sourceView: View, annotation: Node): this {
        this.explorerView.popUntil(sourceView);
        this.sourceViewShowAnnotations(sourceView);
        return this;
    }

    sourceViewShowMetadata(sourceView: View, node: Node): this {
        this.explorerView.popUntil(sourceView);
        alert('sorry, not implemented yet...');
        return this;
    }

    sourceViewHideMetadata(sourceView: View): this {
        // this.explorerView.popUntil(sourceView);
        return this;
    }

    sourceViewEnlarge(sourceView: View): this {
        this.explorerView.popUntil(sourceView);
        alert('sorry, not implemented yet...');
        return this;
    }

    sourceViewShrink(sourceView: View): this {
        return this;
    }

    sourceViewShowAnnotations(sourceView: View): this {
        this.explorerView.popUntil(sourceView);
        let annotationsView = new AnnotationsView({
            collection: sourceView.collection as Graph, ontology: this.explorerView.ontology
        });
        this.explorerView.push(annotationsView);
        return this;
    }

    sourceViewHideAnnotations(sourceView): this {
        this.explorerView.popUntil(sourceView);
        return this;
    }
}
