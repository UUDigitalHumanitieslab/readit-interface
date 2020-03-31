const DEFAULT_EASING = 'easeInOutQuart';

export enum ScrollType {
    Left,
    Top
}

/**
 * Execute an animated scroll.
 * @param scrollType The type of scroll to execute, i.e. scrollTop or scrollLeft.
 * @param scrollableElement The element to scroll. Initial scroll position will be based on this element, using the scrollType.
 * @param targetScrollPosition The position to be scrolled to.
 * @param callback Optional. A callback function to be called when the animation is done.
 * @param durationFactor Optional. Scroll duration is based on the distance to be travelled (capped at 400 and 2000ms).
 * Change this factor to influence the duration, where `duration = distance * factor`. Ideal for slowing down or speeding up
 * the animation if you deem this necessary.
 */
export function animatedScroll(
    scrollType: ScrollType,
    scrollableElement: JQuery<HTMLElement>,
    targetScrollPosition: number,
    callback?: any,
    durationFactor: number = 1
){
    let scrollTypeSetting, initialScrollPosition;
    if (scrollType == ScrollType.Top) {
        scrollTypeSetting = { scrollTop: targetScrollPosition };
        initialScrollPosition = scrollableElement.scrollTop();
    }
    else {
        scrollTypeSetting = { scrollLeft: targetScrollPosition };
        initialScrollPosition = scrollableElement.scrollLeft();
    }

    scrollableElement.animate(
        scrollTypeSetting,
        {
            duration: getScrollDuration(initialScrollPosition, targetScrollPosition, durationFactor),
            easing: DEFAULT_EASING,
            done: callback
        }
    );
}


/**
 * Get the scroll top for a 'scrollTo' element that needs to scrolled to within a scrollable element.
 * Will position scrollTo at the top of the scrollable if scrollTo is heigher than scrollable, and center
 * it vertically otherwise.
 * @param scrollableEl The element that is scrollable, i.e. has overflow-y: scroll (or similar)
 * @param scrollToTop The top of the scrollTo element.
 * @param scrollToHeight The height of the scrollTo element.
 */
export function getScrollTop(scrollableEl: JQuery<HTMLElement>, scrollToTop: number, scrollToHeight: number) {
    // base position: show start at the top
    let scrollTop = scrollToTop - scrollableEl.offset().top + scrollableEl.scrollTop();

    if (scrollToHeight < scrollableEl.height()) {
        // center it
        let centerOffset = (scrollableEl.height() - scrollToHeight) / 2;
        scrollTop = scrollTop - centerOffset;
    }
    return scrollTop;
}


/**
 * Calculate a duration for a scroll based on the distance to be travelled.
 * The duration is capped between 400 and 2000 ms.
 */
export function getScrollDuration(initialScrollPosition: number, targetScrollPosition: number, factor: number = 1): number {
    let distance = (Math.max(initialScrollPosition, targetScrollPosition) - Math.min(initialScrollPosition, targetScrollPosition));
    return Math.min(Math.max(400, distance * factor), 2000);
}
