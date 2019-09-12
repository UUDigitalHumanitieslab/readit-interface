
import { orderBy, remove, clone } from 'lodash';
import { AnnotationPositionDetails } from './../annotation-utilities';
import HighlightView from './highlight-view';

export type HighlightIndex = {
    instance: HighlightView,
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

        // Keep track of active highlights
        let currentlyActiveHighlights = [];

        // Keep track of currently overlapping highlights.
        // Note that this is not the same as currentlyActiveHighlights,
        // especially when more than two highlights are overlapping.
        let currentOverlapHighlights = [];

        // Store the indices of the current overlap
        let currentOverlapPosDetails = [];

        let highlightIndices = this.getHighlightIndices(highlightViews);
        let orderedIndices = orderBy(highlightIndices, ['nodeIndex', 'characterIndex', 'isStart'], ['asc', 'asc', 'desc']);

        orderedIndices.forEach(index => {
            if (index.isStart) {
                currentlyActive++;
                currentOverlapHighlights.push(index.instance);

                if (currentlyActiveHighlights.length === 2) {
                    currentOverlapPosDetails[0] = index.nodeIndex;
                    currentOverlapPosDetails[1] = index.characterIndex;
                }
            }
            else {
                remove(currentlyActiveHighlights, (c) => { return c.cid === index.highlightView.cid });

                if (currentlyActiveHighlights.length === 1) {
                    currentOverlapPosDetails[2] = index.nodeIndex;
                    currentOverlapPosDetails[3] = index.characterIndex;

                    results.push({
                        highlightViews: currentOverlapHighlights, positionDetails: {
                            startNodeIndex: currentOverlapPosDetails[0],
                            startCharacterIndex: currentOverlapPosDetails[1],
                            endNodeIndex: currentOverlapPosDetails[2],
                            endCharacterIndex: currentOverlapPosDetails[3]
                        }
                    });

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
                instance: hV,
                nodeIndex: hV.positionDetails.startNodeIndex,
                characterIndex: hV.positionDetails.startCharacterIndex,
                isStart: true
            });

            indices.push({
                instance: hV,
                nodeIndex: hV.positionDetails.endNodeIndex,
                characterIndex: hV.positionDetails.endCharacterIndex,
                isStart: false
            });
        });

        return indices;
    }
}
