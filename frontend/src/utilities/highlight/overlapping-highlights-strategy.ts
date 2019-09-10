
import { orderBy } from 'lodash';
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

        let currentlyActive = 0;
        let currentOverlapHighlights = [];

        let currentOverlapStartNodeIndex: number;
        let currentOverlapStartCharacterIndex: number;
        let currentOverlapEndNodeIndex: number;
        let currentOverlapEndCharacterIndex: number;

        let highlightIndices = this.getHighlightIndices(highlightViews);
        let orderedIndices = orderBy(highlightIndices, ['nodeIndex', 'characterIndex', 'isStart'], ['asc', 'asc', 'desc']);

        orderedIndices.forEach(index => {
            if (index.isStart) {
                currentlyActive++;
                currentOverlapHighlights.push(index.instance);

                if (currentlyActive === 2) {
                    currentOverlapStartNodeIndex = index.nodeIndex;
                    currentOverlapStartCharacterIndex = index.characterIndex;
                }
            }
            else {
                currentlyActive--;

                if (currentlyActive === 1) {
                    currentOverlapEndNodeIndex = index.nodeIndex;
                    currentOverlapEndCharacterIndex = index.characterIndex;

                    results.push({
                        highlightViews: currentOverlapHighlights, positionDetails: {
                            startNodeIndex: currentOverlapStartNodeIndex,
                            startCharacterIndex: currentOverlapStartCharacterIndex,
                            endNodeIndex: currentOverlapEndNodeIndex,
                            endCharacterIndex: currentOverlapEndCharacterIndex
                        }
                    });
                    currentOverlapHighlights = [];
                }

                if (currentlyActive === 0) {
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
