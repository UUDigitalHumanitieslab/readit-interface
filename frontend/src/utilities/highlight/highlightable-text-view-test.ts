import HighlightableTextView from './highlightable-text-view'


describe('HighlightableTextView', function() {
    function getInstance(): HighlightableTextView {
        return new HighlightableTextView({
            text: "blah",
            isEditable: false,
            showHighlightsInitially: false,
        })
    }


    describe('areOverlapping', function() {
        function getAnnoDetails(startNodeIndex, startCharacterIndex, endNodeIndex, endCharacterIndex) {
            return {
                "startNodeIndex": startNodeIndex,
                "startCharacterIndex": startCharacterIndex,
                "endNodeIndex": endNodeIndex,
                "endCharacterIndex": endCharacterIndex,
                "cssClass": "irrelevant"
            }
        }

        it('finds overlapping highlights: partial overlap, first on left', function() {
            let htv = getInstance();

            let ad1 = getAnnoDetails(5, 10, 7, 23);
            let ad2 = getAnnoDetails(6, 1, 8, 25);

            expect(htv.areOverlapping(ad1, ad2)).toBe(true);
        });

        it('finds overlapping highlights: partial overlap, first on right', function() {
            let htv = getInstance();

            let ad1 = getAnnoDetails(6, 1, 8, 25);
            let ad2 = getAnnoDetails(5, 10, 7, 23);

            expect(htv.areOverlapping(ad1, ad2)).toBe(true);
        });

        it('finds overlapping highlights: full overlap variant 1', function() {
            let htv = getInstance();

            let ad1 = getAnnoDetails(5, 10, 10, 23);
            let ad2 = getAnnoDetails(6, 1, 8, 25);

            expect(htv.areOverlapping(ad1, ad2)).toBe(true);
        });

        it('finds overlapping highlights: full overlap variant 2', function() {
            let htv = getInstance();

            let ad1 = getAnnoDetails(6, 1, 8, 25);
            let ad2 = getAnnoDetails(5, 10, 10, 23);

            expect(htv.areOverlapping(ad1, ad2)).toBe(true);
        });

        it('finds highlights that do not overlap variant 1', function() {
            let htv = getInstance();

            let ad1 = getAnnoDetails(5, 10, 6, 23);
            let ad2 = getAnnoDetails(7, 1, 8, 25);

            expect(htv.areOverlapping(ad1, ad2)).toBe(false);
        });

        it('finds highlights that do not overlap variant 2', function() {
            let htv = getInstance();

            let ad1 = getAnnoDetails(7, 1, 8, 25);
            let ad2 = getAnnoDetails(5, 10, 6, 23);

            expect(htv.areOverlapping(ad1, ad2)).toBe(false);
        });

        it('finds highlights that do not overlap variant 3', function() {
            let htv = getInstance();

            let ad1 = getAnnoDetails(5, 10, 8, 23);
            let ad2 = getAnnoDetails(7, 1, 8, 25);

            expect(htv.areOverlapping(ad1, ad2)).toBe(false);
        });

        it('finds highlights that do not overlap variant 4', function() {
            let htv = getInstance();

            let ad1 = getAnnoDetails(5, 10, 8, 35);
            let ad2 = getAnnoDetails(7, 1, 8, 25);

            expect(htv.areOverlapping(ad1, ad2)).toBe(false);
        });

        it('finds overlapping highlights: same node, first on left', function() {
            let htv = getInstance();

            let ad1 = getAnnoDetails(5, 1, 7, 23);
            let ad2 = getAnnoDetails(5, 11, 8, 25);

            expect(htv.areOverlapping(ad1, ad2)).toBe(true);
        });

        it('finds overlapping highlights: same node, first on right', function() {
            let htv = getInstance();

            let ad1 = getAnnoDetails(5, 11, 7, 23);
            let ad2 = getAnnoDetails(5, 1, 6, 25);

            expect(htv.areOverlapping(ad1, ad2)).toBe(true);
        });

        it('finds overlapping highlights: same node, full overlap variant 1', function() {
            let htv = getInstance();

            let ad1 = getAnnoDetails(5, 11, 5, 23);
            let ad2 = getAnnoDetails(5, 1, 5, 100);

            expect(htv.areOverlapping(ad1, ad2)).toBe(true);
        });

        it('finds overlapping highlights: same node, full overlap variant 2', function() {
            let htv = getInstance();

            let ad1 = getAnnoDetails(5, 1, 5, 100);
            let ad2 = getAnnoDetails(5, 11, 5, 23);

            expect(htv.areOverlapping(ad1, ad2)).toBe(true);
        });

        it('finds highlights not overlapping in the same node variant 1', function() {
            let htv = getInstance();

            let ad1 = getAnnoDetails(5, 1, 5, 10);
            let ad2 = getAnnoDetails(5, 20, 5, 23);

            expect(htv.areOverlapping(ad1, ad2)).toBe(false);
        });

        it('finds highlights not overlapping in the same node variant 2', function() {
            let htv = getInstance();

            let ad1 = getAnnoDetails(5, 20, 5, 23);
            let ad2 = getAnnoDetails(5, 1, 5, 10);

            expect(htv.areOverlapping(ad1, ad2)).toBe(false);
        });
    });
});
