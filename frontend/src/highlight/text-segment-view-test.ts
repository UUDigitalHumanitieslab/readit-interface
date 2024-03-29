import { $ } from 'backbone';

import { onlyIf } from '../test-util';
import loremIpsum from '../lorem-ipsum';
import mockOntology from '../mock-data/mock-ontology';

import Subject from '../common-rdf/subject';
import Graph from '../common-rdf/graph';
import FilteredCollection from '../common-adapters/filtered-collection';
import FlatItem from '../common-adapters/flat-item-model';
import CategoryStyle from '../category-colors/category-colors-view';
import { isColoredClass } from '../utilities/linked-data-utilities';

import Segment from './text-segment-model';
import SegmentView from './text-segment-view';

const attributes = {
    startPosition: 200,
    endPosition: 400,
    cssClass: 'is-readit-content',
};

describe('TextSegmentView', function () {
    const it = onlyIf(document.createRange().getClientRects, 'This suite requires Range support.');

    beforeAll(function () {
        const lineHeightProbe = $('<span>bla</span>').appendTo('body');
        this.lineHeight = lineHeightProbe.height();
        lineHeightProbe.remove();
        const ontology = new Graph(mockOntology);
        this.ontology = new FilteredCollection(ontology, isColoredClass);
        this.style = new CategoryStyle({ collection: this.ontology }).render();
        this.style.$el.appendTo('body');
        this.container = $('<div>').width('70ex').appendTo('body');
        this.text = $('<pre>').css('white-space', 'pre-wrap').text(loremIpsum).appendTo(this.container);
        this.wrapper = $('<div>').appendTo(this.container).css({
            position: 'relative',
            'z-index': -2,
            width: 'auto',
        });
        this.offset = this.wrapper.get(0);
    });

    beforeEach(function () {
        this.annotation = new FlatItem(new Subject());
        this.annotation.set(attributes);
        this.segment = new Segment(attributes);
        this.view = new SegmentView({
            model: this.segment,
            textContainer: this.text,
            offset: this.offset,
        });
        this.view.$el.appendTo(this.wrapper);
        spyOn(this.view, 'position').and.callThrough();
    });

    afterEach(function () {
        this.view.remove();
    });

    afterAll(function () {
        this.wrapper.remove();
        this.text.remove();
        this.container.remove();
        this.style.remove();
    });

    it('does not call this.position() until it has been activated', function () {
        this.segment.annotations.add(this.annotation);
        expect(this.view.position).not.toHaveBeenCalled();
    });

    it('does not call this.position() until it has an annotation', function () {
        this.view.activate();
        expect(this.view.position).not.toHaveBeenCalled();
    });

    it('calls this.position() once annotated and activated', function () {
        this.segment.annotations.add(this.annotation);
        this.view.activate();
        expect(this.view.position).toHaveBeenCalled();
    });

    it('calls this.position() once activated and annotated', function () {
        this.view.activate();
        this.segment.annotations.add(this.annotation);
        expect(this.view.position).toHaveBeenCalled();
    });

    describe('activate', function () {
        it('is idempotent', function () {
            this.view.activate().activate();
            this.segment.annotations.add(this.annotation);
            this.view.activate().activate();
            expect(this.view.position).toHaveBeenCalledTimes(1);
        });
    });

    describe('position', function () {
        it('creates correctly positioned line segment views', function () {
            this.segment.annotations.add([this.annotation, this.annotation]);
            this.view.position(this.segment);
            const lineSegments = this.view.$el.children();
            expect(lineSegments.length).toBeGreaterThan(1);
            expect(lineSegments.length).toBe(this.view.items.length);
            const { top, left } = this.offset.getBoundingClientRect();
            const right = this.wrapper.width() + left;
            lineSegments.each((index, el) => {
                const $el = $(el);
                const offset = $el.offset();
                const width = $el.width();
                const height = $el.height();
                expect(offset.top).toBeGreaterThanOrEqual(top);
                expect(offset.left).toBeGreaterThanOrEqual(left);
                expect(offset.left + width).toBeLessThanOrEqual(right);
                expect(height).toBeLessThanOrEqual(this.lineHeight);
            });
        });
    });
});
