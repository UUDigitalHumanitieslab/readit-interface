import { onlyIf } from '../test-util';

import OverlappingHighlightsStrategy, { HighlightIndex, OverlappingHighlights } from './overlapping-highlights-strategy';
import HighlightView from './highlight-view';
import Node from './../jsonld/node';
import { AnnotationPositionDetails } from './../utilities/annotation-utilities';

describe('OverlappingHighlightsStrategy', function () {
    const it = onlyIf(document.createRange, 'DOM Traversal and Selection APIs required.');

    let strategy = new OverlappingHighlightsStrategy();

    beforeEach(function () {
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
            model: new Node(),
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
                This text servers the purpose of containing highlights,<br/><br/> albeit virtually. A what a joy that such things exists!
            </div>
        </div>`).appendTo('body');
    }

    function getPositionDetails(startNodeIndex, startCharacterIndex, endNodeIndex, endCharacterIndex): AnnotationPositionDetails {
        return {
            startNodeIndex: startNodeIndex,
            startCharacterIndex: startCharacterIndex,
            endNodeIndex: endNodeIndex,
            endCharacterIndex: endCharacterIndex
        };
    }

    function getOverlappingHighlights(highlightViews, positionDetails): OverlappingHighlights {
        return {
            highlightViews: highlightViews,
            positionDetails: positionDetails
        };
    }

    describe('getOverlaps', function () {
        it('finds a single overlap', function () {
            let hV1 = getHighlightView(0, 17, 0, 27);
            let hV2 = getHighlightView(0, 21, 3, 1)
            let expected = [getOverlappingHighlights([hV1, hV2], getPositionDetails(0, 21, 0, 27))];

            let actual = strategy.getOverlaps([hV1, hV2]);
            expect(actual).toEqual(expected);
        });

        it('ignores non overlapping highlights', function () {
            let hV1 = getHighlightView(0, 17, 0, 22)
            let hV2 = getHighlightView(0, 23, 0, 37);
            let hV3 = getHighlightView(0, 32, 3, 1)
            let hV4 = getHighlightView(3, 2, 3, 10);
            let expected = [getOverlappingHighlights([hV2, hV3], getPositionDetails(0, 32, 0, 37))];

            let actual = strategy.getOverlaps([hV1, hV2, hV3, hV4]);
            expect(actual).toEqual(expected);
        });

        it('finds multiple overlapping highlights (i.e. stacked overlaps)', function () {
            let hV1 = getHighlightView(0, 17, 0, 27);
            let hV2 = getHighlightView(0, 21, 3, 1);
            let hV3 = getHighlightView(0, 23, 3, 5);
            let expected = [getOverlappingHighlights([hV1, hV2, hV3], getPositionDetails(0, 21, 3, 1))];

            let actual = strategy.getOverlaps([hV1, hV2, hV3]);
            expect(actual).toEqual(expected);
        });

        it('finds multiple overlaps', function () {
            let hV1 = getHighlightView(0, 17, 0, 27);
            let hV2 = getHighlightView(0, 21, 0, 32);
            let hV3 = getHighlightView(3, 1, 3, 10);
            let hV4 = getHighlightView(3, 5, 3, 15);

            let expected: OverlappingHighlights[] = [
                getOverlappingHighlights([hV1, hV2], getPositionDetails(0, 21, 0, 27)),
                getOverlappingHighlights([hV3, hV4], getPositionDetails(3, 5, 3, 10))
            ];

            let actual = strategy.getOverlaps([hV1, hV2, hV3, hV4]);
            expect(actual).toEqual(expected);
        });

        it('handles a long highlight overlapping multiple others correctly', function () {
            let hV1 = getHighlightView(0, 17, 3, 18);
            let hV2 = getHighlightView(0, 21, 0, 27);
            let hV3 = getHighlightView(3, 1, 3, 5);

            let expected: OverlappingHighlights[] = [
                getOverlappingHighlights([hV1, hV2], getPositionDetails(0, 21, 0, 27)),
                getOverlappingHighlights([hV1, hV3], getPositionDetails(3, 1, 3, 5))
            ];

            let actual = strategy.getOverlaps([hV1, hV2, hV3]);
            expect(actual).toEqual(expected);
        });

        it('handles a long highlight overlapping multiple others correctly (second highlight remains active)', function () {
            let hV1 = getHighlightView(0, 17, 0, 32);
            let hV2 = getHighlightView(0, 21, 3, 25);
            let hV3 = getHighlightView(0, 27, 3, 1);
            let hV4 = getHighlightView(3, 10, 3, 15);

            let expected: OverlappingHighlights[] = [
                getOverlappingHighlights([hV1, hV2, hV3], getPositionDetails(0, 21, 3, 1)),
                getOverlappingHighlights([hV2, hV4], getPositionDetails(3, 10, 3, 15))
            ];

            let actual = strategy.getOverlaps([hV1, hV2, hV3, hV4]);
            expect(actual).toEqual(expected);
        });
    });



    describe('getHighlightIndices', function () {
        it('extracts highlight indices', function () {
            let hV1 = getHighlightView(0, 17, 0, 21);
            let hV2 = getHighlightView(0, 22, 3, 1);

            let expected: HighlightIndex[] = [
                {
                    highlightView: hV1,
                    nodeIndex: 0,
                    characterIndex: 17,
                    isStart: true
                },
                {
                    highlightView: hV1,
                    nodeIndex: 0,
                    characterIndex: 21,
                    isStart: false
                },
                {
                    highlightView: hV2,
                    nodeIndex: 0,
                    characterIndex: 22,
                    isStart: true
                },
                {
                    highlightView: hV2,
                    nodeIndex: 3,
                    characterIndex: 1,
                    isStart: false
                },
            ]

            let actual = strategy.getHighlightIndices([hV1, hV2]);
            expect(actual).toEqual(expected);
        });
    });
});
