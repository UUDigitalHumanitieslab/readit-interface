import OverlappingHighlightsStrategy, { HighlightIndex } from './overlapping-highlights-strategy';
import HighlightView from './highlight-view';
import Node from '../../jsonld/node';

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

    describe('getHighlightIndices', function () {
        it('extracts highlight indices', function () {
            let hV1 = getHighlightView(0,0,0,4);
            let hV2 = getHighlightView(0,5,3,1)

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
