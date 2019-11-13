import { enableI18n } from '../test-util';

import ExplorerView from './explorer-view';
import View from './../core/view';

import mockOntology from './../mock-data/mock-ontology';
import Graph from './../jsonld/graph';

describe('ExplorerView', function () {
    beforeAll(enableI18n);

    beforeEach(function () {
        let firstPanel = new View();
        let ontology = new Graph(mockOntology);
        this.view = new ExplorerView({ first: firstPanel, ontology: ontology });
    });

    it('adds a stack with first panel on init', function () {
        expect(this.view.stacks.length).toEqual(1);
        expect(this.view.stacks[0].panels.length).toEqual(1);
    });

    it('pushes panels onto new stacks', function () {
        let stack1Panel1 = new View();
        this.view.push(stack1Panel1);

        expect(this.view.stacks.length).toEqual(2);
        expect(this.view.stacks[0].panels.length).toEqual(1);
        expect(this.view.stacks[1].panels.length).toEqual(1);
    });

    it('overlays panels onto the rightmost stack', function () {
        let stack1Panel1 = new View();
        this.view.push(stack1Panel1);

        let stack1Panel2 = new View();
        this.view.overlay(stack1Panel2);

        expect(this.view.stacks.length).toEqual(2);
        expect(this.view.stacks[0].panels.length).toEqual(1);
        expect(this.view.stacks[1].panels.length).toEqual(2);
    });

    it('overlays panels onto desired panel', function () {
        let stack1Panel1 = new View();
        this.view.push(stack1Panel1);

        // add one more to prove overlay is not in rightmost stack
        let stack2Panel1 = new View();
        this.view.push(stack2Panel1);

        let stack1Panel2 = new View();
        this.view.overlay(stack1Panel2, stack1Panel1);

        expect(this.view.stacks.length).toEqual(3);
        expect(this.view.stacks[0].panels.length).toEqual(1);
        expect(this.view.stacks[1].panels.length).toEqual(2);
        expect(this.view.stacks[2].panels.length).toEqual(1);
    });

    it('throws RangeError when ontoPanel is not topmost', function () {
        let stack1Panel1 = new View();
        this.view.push(stack1Panel1);

        let overlay1 = new View();
        this.view.overlay(overlay1, stack1Panel1);

        expect(this.view.stacks.length).toEqual(2);
        expect(this.view.stacks[0].panels.length).toEqual(1);
        expect(this.view.stacks[1].panels.length).toEqual(2);

        let expected = new RangeError(`ontoPanel with cid '${stack1Panel1.cid}' is not a topmost panel`);

        let self = this;
        let actual = function () {
            self.view.overlay(overlay2, stack1Panel1);
        }

        let overlay2 = new View();
        expect(actual).toThrow(expected);
    });

    it('pops overlayed panels from the rightmost stack', function () {
        let stack1Panel1 = new View();
        this.view.push(stack1Panel1);

        let stack1Panel2 = new View();
        this.view.overlay(stack1Panel2);

        expect(this.view.stacks.length).toEqual(2);
        expect(this.view.stacks[0].panels.length).toEqual(1);
        expect(this.view.stacks[1].panels.length).toEqual(2);

        this.view.pop();

        expect(this.view.stacks.length).toEqual(2);
        expect(this.view.stacks[0].panels.length).toEqual(1);
        expect(this.view.stacks[1].panels.length).toEqual(1);
    });

    it('pops panels and removes stacks if their last panel is popped', function () {
        let stack1Panel1 = new View();
        this.view.push(stack1Panel1);

        expect(this.view.stacks.length).toEqual(2);
        expect(this.view.stacks[0].panels.length).toEqual(1);
        expect(this.view.stacks[1].panels.length).toEqual(1);

        this.view.pop();

        expect(this.view.stacks.length).toEqual(1);
        expect(this.view.stacks[0].panels.length).toEqual(1);
    });

    it('removes topmost panels that are not on rightmost stack', function () {
        // create two stacks
        let stack1Panel1 = new View();
        this.view.push(stack1Panel1);

        let stack2Panel1 = new View();
        this.view.push(stack2Panel1);

        // overlay onto first stack
        let stack1Panel2 = new View();
        this.view.overlay(stack1Panel2, stack1Panel1);

        expect(this.view.stacks.length).toEqual(3);
        expect(this.view.stacks[0].panels.length).toEqual(1);
        expect(this.view.stacks[1].panels.length).toEqual(2);
        expect(this.view.stacks[2].panels.length).toEqual(1);

        this.view.removeOverlay(stack1Panel2);

        expect(this.view.stacks.length).toEqual(3);
        expect(this.view.stacks[0].panels.length).toEqual(1);
        expect(this.view.stacks[1].panels.length).toEqual(1);
        expect(this.view.stacks[2].panels.length).toEqual(1);
    });

    it('throws RangeError if if overlay to be removed is bottom panel', function () {
        // create two stacks
        let stack1Panel1 = new View();
        this.view.push(stack1Panel1);

        let stack2Panel1 = new View();
        this.view.push(stack2Panel1);

        expect(this.view.stacks.length).toEqual(3);
        expect(this.view.stacks[0].panels.length).toEqual(1);
        expect(this.view.stacks[1].panels.length).toEqual(1);
        expect(this.view.stacks[2].panels.length).toEqual(1);

        let expected = new RangeError(`cannot remove panel with cid '${stack1Panel1.cid}' because it is a bottom panel (not an overlay)`);

        let self = this;
        let actual = function () {
            self.view.removeOverlay(stack1Panel1);
        }

        expect(actual).toThrow(expected);
    });

    it('throws RangeError if overlay to be removed is not topmost', function () {
        let stack1Panel1 = new View();
        this.view.push(stack1Panel1);

        let stack1Panel2 = new View();
        this.view.overlay(stack1Panel2, stack1Panel1);

        expect(this.view.stacks.length).toEqual(2);
        expect(this.view.stacks[0].panels.length).toEqual(1);
        expect(this.view.stacks[1].panels.length).toEqual(2);

        let expected = new RangeError(`panel with cid '${stack1Panel1.cid}' is not a topmost panel`);

        let self = this;
        let actual = function () {
            self.view.removeOverlay(stack1Panel1);
        }

        expect(actual).toThrow(expected);
    });

    it('pops until a certain panel is the rightmost', function () {
        // create two stacks (one with 3 and one with 2 panels)
        let stack1Panel1 = new View();
        this.view.push(stack1Panel1);

        let stack1Panel2 = new View();
        this.view.overlay(stack1Panel2, stack1Panel1);

        let stack1Panel3 = new View();
        this.view.overlay(stack1Panel3, stack1Panel2);

        let stack2Panel1 = new View();
        this.view.push(stack2Panel1);

        let stack2Panel2 = new View();
        this.view.overlay(stack2Panel2, stack2Panel1);

        expect(this.view.stacks.length).toEqual(3);
        expect(this.view.stacks[0].panels.length).toEqual(1);
        expect(this.view.stacks[1].panels.length).toEqual(3);
        expect(this.view.stacks[2].panels.length).toEqual(2);

        // pop until we're back at stack 1, panel 2
        this.view.popUntil(stack1Panel2);

        expect(this.view.stacks.length).toEqual(2);
        expect(this.view.stacks[0].panels.length).toEqual(1);
        expect(this.view.stacks[1].panels.length).toEqual(2);
    });

    it('will not pop (until) if provided panel is the rightmost', function () {
        let stack1Panel1 = new View();
        this.view.push(stack1Panel1);

        let stack1Panel2 = new View();
        this.view.overlay(stack1Panel2, stack1Panel1);

        expect(this.view.stacks.length).toEqual(2);
        expect(this.view.stacks[0].panels.length).toEqual(1);
        expect(this.view.stacks[1].panels.length).toEqual(2);

        // this will not pop any panels
        this.view.popUntil(stack1Panel2);

        expect(this.view.stacks.length).toEqual(2);
        expect(this.view.stacks[0].panels.length).toEqual(1);
        expect(this.view.stacks[1].panels.length).toEqual(2);
    });
});
