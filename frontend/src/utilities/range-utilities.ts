import { indexOf } from 'lodash';
import { AnnotationPositionDetails } from "./annotation/annotation-utilities";


/**
 * Initialize a 'virtual' Range object based on position details.
 * A Range, in this sense, is a highlighted area that, for example shows up when a user
 * selects a piece of text. Note that a Range may consist of multiple rectangles (i.e. when
 * the selection spans multiple lines).
 * @param textWrapper The element that has the full text (incl potential HTML) as its content.
 * Note that this element should be in the DOM, otherwise creating a Range will not work.
 * @param positionDetails The indices on which to base the range.
 */
export function getRange(
    textWrapper: JQuery<HTMLElement>,
    positionDetails: AnnotationPositionDetails,
): Range {
    let range = document.createRange();
    let startContainer = textWrapper.contents().get(0);
    let endContainer = textWrapper.contents().get(0);
    range.setStart(startContainer, positionDetails.startIndex);
    range.setEnd(endContainer, positionDetails.endIndex);

    // Workaround for Safari in order to prevent empty rects.
    const selection = document.getSelection();
    selection.addRange(range);
    selection.removeAllRanges();  // Safari cannot remove a single range.
    // End of workaround for Safari.

    return range;
}

export function getPositionDetailsFromRange(textWrapper: JQuery<HTMLElement>, range: Range): AnnotationPositionDetails {
    return {
        startIndex: range.startOffset,
        endIndex: range.endOffset
    }
}
