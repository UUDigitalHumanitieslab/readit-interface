
import { orderBy, remove, clone, reduce } from 'lodash';
import { AnnotationPositionDetails } from '../utilities/annotation/annotation-utilities';
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

type OverlapCalculationStatus = {
    results: OverlappingHighlights[];

    // Keep track of 'active' highlights, i.e. the highlights that are currently overlapping.
    // Note that this is not the same as the 'overlapping' variable.
    // Example: three highlights overlap, one of them ends, and then before one of the last
    // two ends, a fourth highlight begins.
    // The current variable keeps track of the number of highlights 'active' at the current index,
    // whereas overlapping stores all highlights that are part of the current overlap.
    active: HighlightView[];

    // Keep track of highlights that are part of the current overlap.
    // Note that this is not the same as active,
    // especially when more than two highlights are overlapping.
    // See above for example.
    overlapping: HighlightView[];

    // Store the indices of the current overlap
    overlapPositionDetails: Partial<AnnotationPositionDetails>;
}

export default class OverlappingHighlightsStrategy {
    getOverlaps(highlightViews: HighlightView[]): OverlappingHighlights[] {
        let status: OverlapCalculationStatus = { results: [], active: [], overlapping: [], overlapPositionDetails: {} }
        let highlightIndices = this.getHighlightIndices(highlightViews);
        let orderedIndices = orderBy(highlightIndices, ['nodeIndex', 'characterIndex', 'isStart'], ['asc', 'asc', 'desc']);

        return reduce(orderedIndices, this.processIndex.bind(this), status).results;
    }

    processIndex(accumulator: OverlapCalculationStatus, index: HighlightIndex) {
        if (index.isStart) {
            this.processStart(accumulator, index);
        }
        else {
            this.processEnd(accumulator, index);
        }
        return accumulator;
    }

    processStart(
        status: OverlapCalculationStatus,
        index: HighlightIndex,
    ): void {
        status.active.push(index.highlightView);
        status.overlapping.push(index.highlightView);

        if (status.active.length === 2) {
            status.overlapPositionDetails.startNodeIndex = index.nodeIndex;
            status.overlapPositionDetails.startCharacterIndex = index.characterIndex;
        }
    }

    processEnd(
        status: OverlapCalculationStatus,
        index: HighlightIndex,
    ): void {
        remove(status.active, (c) => { return c.cid === index.highlightView.cid });

        if (status.active.length === 1) {
            status.overlapPositionDetails.endNodeIndex = index.nodeIndex;
            status.overlapPositionDetails.endCharacterIndex = index.characterIndex;

            status.results.push({
                highlightViews: status.overlapping,
                positionDetails: status.overlapPositionDetails as AnnotationPositionDetails
            });

            status.overlapPositionDetails = {};
            status.overlapping = [status.active[0]];
        }

        if (status.active.length === 0) {
            status.overlapping = [];
        }
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
