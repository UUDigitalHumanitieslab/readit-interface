import { onlyIf } from '../test-util';

import OverlappingHighlightsStrategy, { HighlightIndex, OverlappingHighlights } from './overlapping-highlights-strategy';
import HighlightView from './highlight-view';
import Node from './../jsonld/node';
import { AnnotationPositionDetails } from '../utilities/annotation/annotation-utilities';

describe('OverlappingHighlightsStrategy', function () {
    const it = onlyIf(document.createRange, 'DOM Traversal and Selection APIs required.');

    let strategy = new OverlappingHighlightsStrategy();

    beforeEach(function () {
        createSomeHtml();
    });

    afterEach(function () {
        $('.relativeParent').remove();
    });

    function getHighlightView(startIndex, endIndex) {
        let textWrapper = $('.textWrapper');
        let relativeParent = $('.relativeParent');

        let range = document.createRange();
        let startContainer = textWrapper.contents().get(0);
        let endContainer = textWrapper.contents().get(0);
        range.setStart(startContainer, startIndex);
        range.setEnd(endContainer, endIndex);

        return new HighlightView({
            model: undefined,
            textWrapper: textWrapper,
            cssClass: 'irrelevant',
            relativeParent: relativeParent,
            isDeletable: false,
            positionDetails: { startIndex, endIndex }
        });
    }

    function createSomeHtml() {
        $(`<div class="relativeParent">
            <div class="textWrapper">
                This text servers the purpose of containing highlights, albeit virtually. A what a joy that such things exists!
            </div>
        </div>`).appendTo('body');
    }

    function getPositionDetails(startIndex, endIndex): AnnotationPositionDetails {
        return { startIndex, endIndex };
    }

    function getOverlappingHighlights(highlightViews, positionDetails): OverlappingHighlights {
        return {
            highlightViews: highlightViews,
            positionDetails: positionDetails
        };
    }

    describe('getOverlaps', function () {
        it('finds a single overlap', function () {
            let hV1 = getHighlightView(17, 27);
            let hV2 = getHighlightView(21, 41)
            let expected = [getOverlappingHighlights([hV1, hV2], getPositionDetails(21, 27))];

            let actual = strategy.getOverlaps([hV1, hV2]);
            expect(actual).toEqual(expected);
        });

        it('ignores non overlapping highlights', function () {
            let hV1 = getHighlightView(17, 22)
            let hV2 = getHighlightView(23, 37);
            let hV3 = getHighlightView(32, 41)
            let hV4 = getHighlightView(42, 50);
            let expected = [getOverlappingHighlights([hV2, hV3], getPositionDetails(32, 37))];

            let actual = strategy.getOverlaps([hV1, hV2, hV3, hV4]);
            expect(actual).toEqual(expected);
        });

        it('finds multiple overlapping highlights (i.e. stacked overlaps)', function () {
            let hV1 = getHighlightView(17, 27);
            let hV2 = getHighlightView(21, 41);
            let hV3 = getHighlightView(23, 45);
            let expected = [getOverlappingHighlights([hV1, hV2, hV3], getPositionDetails(21, 41))];

            let actual = strategy.getOverlaps([hV1, hV2, hV3]);
            expect(actual).toEqual(expected);
        });

        it('finds multiple overlaps', function () {
            let hV1 = getHighlightView(17, 27);
            let hV2 = getHighlightView(21, 32);
            let hV3 = getHighlightView(41, 50);
            let hV4 = getHighlightView(45, 55);

            let expected: OverlappingHighlights[] = [
                getOverlappingHighlights([hV1, hV2], getPositionDetails(21, 27)),
                getOverlappingHighlights([hV3, hV4], getPositionDetails(45, 50))
            ];

            let actual = strategy.getOverlaps([hV1, hV2, hV3, hV4]);
            expect(actual).toEqual(expected);
        });

        it('handles a long highlight overlapping multiple others correctly', function () {
            let hV1 = getHighlightView(17, 110);
            let hV2 = getHighlightView(21, 27);
            let hV3 = getHighlightView(41, 45);

            let expected: OverlappingHighlights[] = [
                getOverlappingHighlights([hV1, hV2], getPositionDetails(21, 27)),
                getOverlappingHighlights([hV1, hV3], getPositionDetails(41, 45))
            ];

            let actual = strategy.getOverlaps([hV1, hV2, hV3]);
            expect(actual).toEqual(expected);
        });

        it('handles a long highlight overlapping multiple others correctly (second highlight remains active)', function () {
            let hV1 = getHighlightView(17, 32);
            let hV2 = getHighlightView(21, 65);
            let hV3 = getHighlightView(27, 41);
            let hV4 = getHighlightView(50, 55);

            let expected: OverlappingHighlights[] = [
                getOverlappingHighlights([hV1, hV2, hV3], getPositionDetails(21, 41)),
                getOverlappingHighlights([hV2, hV4], getPositionDetails(50, 55))
            ];

            let actual = strategy.getOverlaps([hV1, hV2, hV3, hV4]);
            expect(actual).toEqual(expected);
        });
    });



    describe('getHighlightIndices', function () {
        it('extracts highlight indices', function () {
            let hV1 = getHighlightView(17, 21);
            let hV2 = getHighlightView(22, 41);

            let expected: HighlightIndex[] = [
                {
                    highlightView: hV1,
                    characterIndex: 17,
                    isStart: true
                },
                {
                    highlightView: hV1,
                    characterIndex: 21,
                    isStart: false
                },
                {
                    highlightView: hV2,
                    characterIndex: 22,
                    isStart: true
                },
                {
                    highlightView: hV2,
                    characterIndex: 41,
                    isStart: false
                },
            ]

            let actual = strategy.getHighlightIndices([hV1, hV2]);
            expect(actual).toEqual(expected);
        });
    });
});
