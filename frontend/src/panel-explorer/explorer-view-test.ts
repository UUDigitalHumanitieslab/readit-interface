import { $ } from 'backbone';
import { times, after } from 'lodash';

import './../global/scroll-easings';
import { enableI18n } from '../test-util';

import ExplorerView from './explorer-view';
import View from './../core/view';

import fastTimeout from '../utilities/fastTimeout';

describe('ExplorerView', function () {
    beforeAll(enableI18n);

    beforeEach(function () {
        let firstPanel = new View();
        this.view = new ExplorerView({ first: firstPanel });
    });

    afterEach(function() {
        this.view.remove();
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

    it('pops overlayed panels from the rightmost stack', function (done) {
        let stack1Panel1 = new View();
        this.view.push(stack1Panel1);

        let stack1Panel2 = new View();
        this.view.overlay(stack1Panel2);

        expect(this.view.stacks.length).toEqual(2);
        expect(this.view.stacks[0].panels.length).toEqual(1);
        expect(this.view.stacks[1].panels.length).toEqual(2);

        this.view.pop();
        this.view.once('pop', () => {
            expect(this.view.stacks.length).toEqual(2);
            expect(this.view.stacks[0].panels.length).toEqual(1);
            expect(this.view.stacks[1].panels.length).toEqual(1);
            done();
        });
    });

    it('pops panels and removes stacks if their last panel is popped', function (done) {
        let stack1Panel1 = new View();
        this.view.push(stack1Panel1);

        expect(this.view.stacks.length).toEqual(2);
        expect(this.view.stacks[0].panels.length).toEqual(1);
        expect(this.view.stacks[1].panels.length).toEqual(1);

        this.view.once('pop', () => {
            expect(this.view.stacks.length).toEqual(1);
            expect(this.view.stacks[0].panels.length).toEqual(1);
            done();
        });
        this.view.pop();
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

    it('pops until a certain panel is the rightmost', async function () {
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
        await this.view.popUntilAsync(stack1Panel2)
        expect(this.view.stacks.length).toEqual(2);
        expect(this.view.stacks[0].panels.length).toEqual(1);
        expect(this.view.stacks[1].panels.length).toEqual(2);
    });

    it('will not pop (until) if provided panel is the rightmost', function(cb) {
        let stack1Panel1 = new View();
        this.view.push(stack1Panel1);

        let stack1Panel2 = new View();
        this.view.overlay(stack1Panel2, stack1Panel1);

        const expectSame = () => {
            expect(this.view.stacks.length).toEqual(2);
            expect(this.view.stacks[0].panels.length).toEqual(1);
            expect(this.view.stacks[1].panels.length).toEqual(2);
        };

        expectSame();

        this.view.once('pop:until', () => {
            expectSame();
            cb();
        });

        // this will not pop any panels
        this.view.popUntil(stack1Panel2);
    });

    it('does not push prematurely with popUntilAndPush', function(done) {
        // Fake the scroll method in order to save time.
        spyOn(this.view, 'scroll').and.callFake(function(stack, callback) {
            callback && fastTimeout(callback);
            return this;
        });

        const firstPanel = this.view.getRightMostStack().getTopPanel();

        // Push lots of panels, should give ample opportunity for bugs. Ideally
        // 1000 as this enables the infinite loop detection, but since
        // fastTimeout isn't any faster than regular setTimeout in JSDOM, only
        // 100 in JSDOM.
        const numPanels = document.hidden ? 100 : 1000;
        times(numPanels, () => this.view.push(new View()));

        // The panel that we'll push after popping all of the above.
        const pushee = new View();

        // We're going to handle two events, after that we're done.
        const advanceProgress = after(2, done);
        spyOn(this.view, 'push').and.callThrough();

        this.view.once('pop:until', () => {
            expect(this.view.push).not.toHaveBeenCalled();
            advanceProgress();
        });

        // This should run after the previous event.
        this.view.once('push', () => {
            expect(this.view.push).toHaveBeenCalledWith(pushee);
            advanceProgress();
        });

        // Set everything in motion.
        this.view.popUntilAndPush(firstPanel, pushee);
    });
});
