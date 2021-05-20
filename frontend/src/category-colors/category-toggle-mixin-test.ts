import {
    assign,
    map,
    compact,
    random,
    sample,
    sampleSize,
    includes,
} from 'lodash';
import { $ } from 'backbone';

import mockOntology from '../mock-data/mock-ontology';

import View from '../core/view';
import Graph from '../common-rdf/graph';
import { getCssClassName } from '../utilities/linked-data-utilities';
import CategoryStyling from './category-colors-view';
import ToggleMixin from './category-toggle-mixin';

// Define a view class that uses the CategoryToggleMixin. We use it in the tests
// below, but at the same time it is also check that TypeScript understands what
// is going on. This also demonstrates the basic pattern of using a mixin in
// TypeScript (DEMO MARKER).
interface MixedView extends ToggleMixin { }
class MixedView extends View {
    testProperty: string;
    constructor() {
        super();
        this.testProperty = 'nice';
    }
}
assign(MixedView.prototype, ToggleMixin.prototype);
// End of DEMO MARKER.

// A utility function for quickly composing an arbitrary document tree without
// having to type a lot of HTML. We use it in `beforeEach` below.
function e(tagName: string, className: string, subelem: JQuery[]): JQuery {
    return $(`<${tagName}>`).addClass(className).append(subelem);
}

// Given a list of CSS class names, compose a jQuery selector that will match
// elements with at least one of the class names.
function selector(classNames: string[]): string {
    return map(classNames, name => `.${name}`).join(', ');
}

describe('CategoryToggleMixin', function () {
    beforeAll(function () {
        this.ontology = new Graph(mockOntology);
        this.classes = compact(this.ontology.map(getCssClassName));
        expect(this.classes.length).toBeGreaterThan(1);
        this.styling = new CategoryStyling({ collection: this.ontology, nlpCollection: this.ontology });
        $('body').append(this.styling.render().el);
    });

    afterAll(function () {
        this.styling.remove();
    });

    beforeEach(function () {
        const classes = this.classes;
        this.mixed = new MixedView();
        // We put an arbitrary document tree inside our mixed view, where about
        // half of the elements has a CSS class from the ontology categories.
        // The tree combines different default display types and variations of
        // nesting. The assignment of category classes is random and different
        // on every run; this makes this suite a sort of "slow fuzz test".
        this.mixed.$el.append([
            e('p', sample(classes), []),  // <p class="is-readit-xyz"></p>
            e('span', sample(classes), []),
            e('div', sample(classes), []),
            e('article', sample(classes), []),
            e('ul', '', [
                e('li', sample(classes), []),
                e('li', sample(classes), []),
                e('li', sample(classes), []),
                e('li', sample(classes), []),
            ]),
            e('article', '', [
                e('heading', '', [
                    e('h1', '', []),
                    e('div', sample(classes), []),
                ]),
                e('section', '', [
                    e('div', sample(classes), [
                        e('h2', '', []),
                        e('p', '', []),
                    ]),
                    e('div', sample(classes), [
                        e('h2', '', []),
                        e('p', '', []),
                    ]),
                    e('div', sample(classes), [
                        e('h2', '', []),
                        e('p', '', []),
                    ]),
                ]),
            ]),
        ]);
        // We also have some elements with category classes outside of our mixed
        // view so we can check for side effects.
        this.external = e('ul', '', [
            e('li', sample(classes), []),
            e('li', sample(classes), []),
            e('li', sample(classes), []),
            e('li', sample(classes), []),
            e('li', sample(classes), []),
        ]);
        $('body').append(this.mixed.el, this.external);
    });

    afterEach(function () {
        this.mixed.remove();
        this.external.remove();
    });

    it("doesn't interfere with the constructor of the mixing view", function () {
        expect(this.mixed.testProperty).toBe('nice');
    });

    it('can hide everything with a relevant class', function () {
        const elems = this.mixed.toggleCategories([]).$('*');
        expect(elems.length).toBe(23);
        elems.each(
            (index, el) => {
                let expectDisplay = expect($(el).css('display'));
                if (includes(this.classes, $(el).prop('class'))) {
                    expectDisplay.toBe('none');
                } else {
                    expectDisplay.not.toBe('none');
                }
            }
        );
    });

    it('does not affect elements outside of the mixing view', function () {
        this.mixed.toggleCategories([]);
        const elems = this.external.find('*');
        expect(elems.length).toBe(5);
        elems.each(
            (index, el) => expect($(el).css('display')).not.toBe('none')
        );
    });

    it('can undo hiding everything', function () {
        const elems = this.mixed.toggleCategories([]).toggleCategories().$('*');
        expect(elems.length).toBe(23);
        elems.each(
            (index, el) => expect($(el).css('display')).not.toBe('none')
        );
    });

    it('can whitelist category classes', function () {
        const upperBound = this.classes.length - 1;
        const whitelist = sampleSize(this.classes, random(1, upperBound));
        const selective = selector(this.classes);
        const elems = this.mixed.toggleCategories(whitelist).$(selective);
        expect(elems.length).toBe(12);
        elems.each(
            (index, el) => {
                let expectDisplay = expect($(el).css('display'));
                if (includes(whitelist, $(el).prop('class'))) {
                    expectDisplay.not.toBe('none');
                } else {
                    expectDisplay.toBe('none');
                }
            }
        );
    });

    it('can blacklist category classes', function () {
        const upperBound = this.classes.length - 1;
        const blacklist = sampleSize(this.classes, random(1, upperBound));
        const selective = selector(this.classes);
        const elems = this.mixed.toggleCategories(null, blacklist).$(selective);
        expect(elems.length).toBe(12);
        elems.each(
            (index, el) => {
                let expectDisplay = expect($(el).css('display'));
                if (includes(blacklist, $(el).prop('class'))) {
                    expectDisplay.toBe('none');
                } else {
                    expectDisplay.not.toBe('none');
                }
            }
        );
    });
});
