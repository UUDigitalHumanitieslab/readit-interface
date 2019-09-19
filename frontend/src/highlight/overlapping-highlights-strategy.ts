
import { orderBy, remove, clone } from 'lodash';
import { AnnotationPositionDetails } from './../utilities/annotation-utilities';
import HighlightView from './highlight-view';

export type HighlightIndex = {
    highlightView: HighlightView,
    nodeIndex: number,
    characterIndex: number,
    isStart: boolean
}

export type OverlappingHighlights = {
    highlightViews: HighlightView[];
    positionDetails: AnnotationPositionDetails;
}

export default class OverlappingHighlightsStrategy {
    getOverlaps(highlightViews: HighlightView[]): OverlappingHighlights[] {
        let results = [];

        // Keep track of active highlights, i.e. the highlights that are currently overlapping.
        // Note that this is not the same as currentOverlapHighlights.
        // Example: three highlights overlap, one of them ends, and then before one of the last
        // two ends, a fourth highlight begins.
        // The current variable keeps track of the number of highlights 'active' at the current index,
        // whereas currentOverlapHighlights stores all highlights that are part of the current overlap.
        let currentlyActiveHighlights = [];

        // Keep track of highlights that are part of the current overlap.
        // Note that this is not the same as currentlyActiveHighlights,
        // especially when more than two highlights are overlapping.
        // See above for example.
        let currentOverlapHighlights = [];

        // Store the indices of the current overlap
        let currentOverlapPosDetails: Partial<AnnotationPositionDetails> = {};

        let highlightIndices = this.getHighlightIndices(highlightViews);
        let orderedIndices = orderBy(highlightIndices, ['nodeIndex', 'characterIndex', 'isStart'], ['asc', 'asc', 'desc']);

        orderedIndices.forEach(index => {
            if (index.isStart) {
                currentlyActiveHighlights.push(index.highlightView);
                currentOverlapHighlights.push(index.highlightView);

                if (currentlyActiveHighlights.length === 2) {
                    currentOverlapPosDetails.startNodeIndex = index.nodeIndex;
                    currentOverlapPosDetails.startCharacterIndex = index.characterIndex;
                }
            }
            else {
                remove(currentlyActiveHighlights, (c) => { return c.cid === index.highlightView.cid });

                if (currentlyActiveHighlights.length === 1) {
                    currentOverlapPosDetails.endNodeIndex = index.nodeIndex;
                    currentOverlapPosDetails.endCharacterIndex = index.characterIndex;

                    results.push({
                        highlightViews: currentOverlapHighlights,
                        positionDetails: currentOverlapPosDetails
                    });

                    currentOverlapPosDetails = {};
                    currentOverlapHighlights = [currentlyActiveHighlights[0]];
                }

                if (currentlyActiveHighlights.length === 0) {
                    currentOverlapHighlights = [];
                }
            }
        });

        return results;
    }

    getHighlightIndices(highlightViews: HighlightView[]): HighlightIndex[] {
        let indices = [];

        highlightViews.forEach(hV => {
            indices.push({
                highlightView: hV,
                nodeIndex: hV.positionDetails.startNodeIndex,
                characterIndex: hV.positionDetails.startCharacterIndex,
                isStart: true
            });

            indices.push({
                highlightView: hV,
                nodeIndex: hV.positionDetails.endNodeIndex,
                characterIndex: hV.positionDetails.endCharacterIndex,
                isStart: false
            });
        });

        return indices;
    }
}
