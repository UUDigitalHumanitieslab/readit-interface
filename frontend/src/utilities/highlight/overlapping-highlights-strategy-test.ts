import OverlappingHighlightsStrategy, { HighlightIndex, OverlappingHighlights } from './overlapping-highlights-strategy';
import HighlightView from './highlight-view';
import Node from '../../jsonld/node';
import { AnnotationPositionDetails } from '../annotation-utilities';

describe('OverlappingHighlightsStrategy', function () {
    let highlightViews: HighlightView[];
    let strategy = new OverlappingHighlightsStrategy();
    let node = new Node();

    beforeEach(function () {
        highlightViews = [];
        createSomeHtml();
    });

    afterEach(function () {
        $('.relativeParent').remove();
    });

    function getHighlightView(startNodeIndex, startCharacterIndex, endNodeIndex, endCharacterIndex) {
        let textWrapper = $('.textWrapper');
        let relativeParent = $('.relativeParent');

        let range = document.createRange();
        let startContainer = textWrapper.contents().eq(startNodeIndex).get(0);
        let endContainer = textWrapper.contents().eq(endNodeIndex).get(0);
        range.setStart(startContainer, startCharacterIndex);
        range.setEnd(endContainer, endCharacterIndex);

        return new HighlightView({
            model: node,
            range: range,
            cssClass: 'irrelevant',
            relativeParent: relativeParent,
            isDeletable: false,
            positionDetails: {
                startNodeIndex,
                startCharacterIndex,
                endNodeIndex,
                endCharacterIndex
            }
        });
    }

    function createSomeHtml() {
        $(`<div class="relativeParent">
            <div class="textWrapper">
                This text servers the purpose of containing highlights,<br/><br/> albeit virtually. Hide it if it bothers you.
            </div>
        </div>`).appendTo('body');
    }

    describe('getOverlaps', function () {
        it('finds a single overlap', function () {
            let hV1 = getHighlightView(0, 0, 0, 10);
            let hV2 = getHighlightView(0, 4, 3, 1)

            highlightViews.push(hV1);
            highlightViews.push(hV2);

            let expectedPosDetails: AnnotationPositionDetails = {
                startNodeIndex: 0,
                startCharacterIndex: 4,
                endNodeIndex: 0,
                endCharacterIndex: 10
            };

            let expected: OverlappingHighlights[] = [{
                highlightViews: [hV1, hV2],
                positionDetails: expectedPosDetails
            }];

            let actual = strategy.getOverlaps(highlightViews);

            expect(actual).toEqual(expected);
        });

        it('ignores non overlapping highlights', function () {
            let hV0 = getHighlightView(0, 0, 0, 5)
            let hV1 = getHighlightView(0, 6, 0, 20);
            let hV2 = getHighlightView(0, 15, 3, 1)
            let hV3 = getHighlightView(3, 2, 3, 10);

            highlightViews.push(hV0);
            highlightViews.push(hV1);
            highlightViews.push(hV2);
            highlightViews.push(hV3);

            let expectedPosDetails: AnnotationPositionDetails = {
                startNodeIndex: 0,
                startCharacterIndex: 15,
                endNodeIndex: 0,
                endCharacterIndex: 20
            };

            let expected: OverlappingHighlights[] = [{
                highlightViews: [hV1, hV2],
                positionDetails: expectedPosDetails
            }];

            let actual = strategy.getOverlaps(highlightViews);
            expect(actual).toEqual(expected);
        });

        it('finds multiple overlapping highlights (i.e. stacked overlaps)', function () {
            let hV1 = getHighlightView(0, 0, 0, 10);
            let hV2 = getHighlightView(0, 4, 3, 1);
            let hV3 = getHighlightView(0, 6, 3, 5);

            highlightViews.push(hV1);
            highlightViews.push(hV2);
            highlightViews.push(hV3);

            let expectedPosDetails: AnnotationPositionDetails = {
                startNodeIndex: 0,
                startCharacterIndex: 4,
                endNodeIndex: 3,
                endCharacterIndex: 1
            };

            let expected: OverlappingHighlights[] = [{
                highlightViews: [hV1, hV2, hV3],
                positionDetails: expectedPosDetails
            }];

            let actual = strategy.getOverlaps(highlightViews);

            expect(actual).toEqual(expected);
        });

        it('finds multiple overlaps', function () {
            let hV1 = getHighlightView(0, 0, 0, 10);
            let hV2 = getHighlightView(0, 4, 0, 15);
            let hV3 = getHighlightView(3, 1, 3, 10);
            let hV4 = getHighlightView(3, 5, 3, 15);

            highlightViews.push(hV1);
            highlightViews.push(hV2);
            highlightViews.push(hV3);
            highlightViews.push(hV4);

            let expectedPosDetails1: AnnotationPositionDetails = {
                startNodeIndex: 0,
                startCharacterIndex: 4,
                endNodeIndex: 0,
                endCharacterIndex: 10
            };

            let expectedPosDetails2: AnnotationPositionDetails = {
                startNodeIndex: 3,
                startCharacterIndex: 5,
                endNodeIndex: 3,
                endCharacterIndex: 10
            };

            let expected: OverlappingHighlights[] = [
            {
                highlightViews: [hV1, hV2],
                positionDetails: expectedPosDetails1
            },
            {
                highlightViews: [hV3, hV4],
                positionDetails: expectedPosDetails2
            }];

            let actual = strategy.getOverlaps(highlightViews);

            expect(actual).toEqual(expected);
        });
    });



    describe('getHighlightIndices', function () {
        it('extracts highlight indices', function () {
            let hV1 = getHighlightView(0, 0, 0, 4);
            let hV2 = getHighlightView(0, 5, 3, 1)

            highlightViews.push(hV1);
            highlightViews.push(hV2);

            let expected: HighlightIndex[] = [
                {
                    instance: hV1,
                    nodeIndex: 0,
                    characterIndex: 0,
                    isStart: true
                },
                {
                    instance: hV1,
                    nodeIndex: 0,
                    characterIndex: 4,
                    isStart: false
                },
                {
                    instance: hV2,
                    nodeIndex: 0,
                    characterIndex: 5,
                    isStart: true
                },
                {
                    instance: hV2,
                    nodeIndex: 3,
                    characterIndex: 1,
                    isStart: false
                },
            ]

            let actual = strategy.getHighlightIndices(highlightViews);
            expect(actual.sort()).toEqual(expected.sort());
        });
    });
});
