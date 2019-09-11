import View from './../core/view';

import Node from './../jsonld/node';

import ExplorerView from './explorer-view';
import SourceView from '../panel-source/source-view';
import LdItemView from '../panel-ld-item/ld-item-view';
import HighlightView from '../utilities/highlight/highlight-view';

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
