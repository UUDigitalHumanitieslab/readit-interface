import View from './../core/view';

import ExplorerView from './explorer-view';
import SourceView from '../panel-source/source-view';
import LdItemView from '../panel-ld-item/ld-item-view';

import mockLdItem from './../mock-data/mock-lditem';

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
            'toolbarClicked': this.sourceViewToolbarClicked,
        }, this);
    }

    /**
     * Fake method for testing purposes
     * @param buttonClicked
     */
    sourceViewToolbarClicked(buttonClicked: string): void {
        let ldiView = new LdItemView({ model: mockLdItem });

        if (buttonClicked == 'metadata') {
            this.explorerView.overlay(ldiView);
        } else if (buttonClicked == 'annotations') {
            let panel = this.explorerView.stacks[1].getTopPanel();
            let sView = new SourceView();
            this.explorerView.overlay(sView, panel);
        } else {
            this.explorerView.push(ldiView);
        }
    }

    /**
     * Fake method for testing purposes
     * @param buttonClicked
     */
    ldItemViewFakeButtonClicked() {
        let sourceView = new SourceView();
        this.explorerView.push(sourceView);
    }

}
