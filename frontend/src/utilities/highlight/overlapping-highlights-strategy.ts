
import { AnnotationPositionDetails } from './../annotation-utilities';
import HighlightView from './highlight-view';

export type HighlightIndex = {
    instance: HighlightView,
    nodeIndex: number,
    characterIndex: number,
    isStart: boolean
}

export default class OverlappingHighlightsStrategy {

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
