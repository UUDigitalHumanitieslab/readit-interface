
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
        let currentOverlapPosDetails = [];

        let highlightIndices = this.getHighlightIndices(highlightViews);
        let orderedIndices = orderBy(highlightIndices, ['nodeIndex', 'characterIndex', 'isStart'], ['asc', 'asc', 'desc']);

        orderedIndices.forEach(index => {
            if (index.isStart) {
                currentlyActive++;
                currentOverlapHighlights.push(index.instance);

                if (currentlyActive === 2) {
                    currentOverlapPosDetails[0] = index.nodeIndex;
                    currentOverlapPosDetails[1] = index.characterIndex;
                }
            }
            else {
                currentlyActive--;

                if (currentlyActive === 1) {
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
