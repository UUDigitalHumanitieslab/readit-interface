import * as $ from 'jquery';

/**
 * Extend jQuery with the easing functions we use.
 * These can be added to (scroll) animations, for example: `element.animate({ scrollLeft: 100 }, <duration>, 'easeInOutQuart');`
 *
 * The code below is borrowed from https://gist.github.com/slig/145d7333052b7b2532f90d9f47e20d8e.
 * If you require any other easings, you can probably find the code for it there.
 * Nice overview of available stuff: https://easings.net/
 */

$.extend($.easing,
    {
        easeInOutQuart(x: number) {
            return x < 0.5 ?
                8 * x * x * x * x :
                1 - Math.pow(-2 * x + 2, 4) / 2;
        },

    }
);
