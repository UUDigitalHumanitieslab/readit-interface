import View from './../core/view';
import { defer } from 'lodash';
import Node from './../jsonld/node';

import ExplorerView from './explorer-view';
import SourceView from '../panel-source/source-view';
import LdItemView from '../panel-ld-item/ld-item-view';
import Graph from '../jsonld/graph';
import AnnotationsView from '../annotation-panels/panel-annotations-view';



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
            'fakeBtnClicked': this.ldItemViewFakeButtonClicked,
            'showMetadata': this.sourceViewShowMetadata,
            'showAnnotations': (graph) => defer(this.sourceViewShowAnnotations, graph),
            'enlarge': this.sourceViewEnlarge,
        }, this);
    }

    /**
     * Fake method for testing purposes
     * @param buttonClicked
     */
    sourceViewShowMetadata(node: Node): void {
        // let ldiView = new LdItemView({ model: mockLdItem });
        // this.explorerView.push(ldiView);
    }

    sourceViewEnlarge(node: Node): void {
        // let ldiView = new LdItemView({ model: mockLdItem });
        // this.explorerView.push(ldiView);
    }

    sourceViewShowAnnotations(graph: Graph): void {
        // This is just here as an example on how to add a second panel
        // on an event triggered by the explorer's 'first' panel.
        // The trick is the defer() in the event hash above
    }

    /**
     * Fake method for testing purposes
     * @param buttonClicked
     */
    ldItemViewFakeButtonClicked() {
        // let ldiView = new LdItemView({ model: mockLdItem });
        // this.explorerView.push(ldiView);
        // let sourceView = new SourceView({ annotations: getMockAnnotationsGraph(), inFullViewportMode: false });
        // this.explorerView.push(sourceView);
    }

}
