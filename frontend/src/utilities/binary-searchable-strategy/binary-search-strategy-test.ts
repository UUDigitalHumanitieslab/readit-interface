import { BinarySearchStrategy } from './binary-search-strategy';
import View from '../../core/view';

type TestView = {
    view: View;
    indexValue: number;
};

describe('BinarySearchStrategy', function () {
    let testViews: TestView[];
    let strategy: BinarySearchStrategy;
    let view1, view2, view3, view4;

    /**
     * Find the indexValue for a View that is in testViews.
     */
    function getIndexValue(view: View): number {
        return testViews.find(v => v.view === view).indexValue;
    }

    /**
     * Get an empty instance of View that is registered with in testViews.
     */
    function getView(indexValue: number): View {
        let view = new View();
        testViews.push({ indexValue: indexValue, view: view});
        return view;
    }

    beforeEach(function () {
        // always start with fresh four views
        testViews = [];
        view1 = getView(1);
        view2 = getView(3);
        view3 = getView(6);
        view4 = getView(9);

        strategy = new BinarySearchStrategy(getIndexValue);
        strategy.add(view1);
        strategy.add(view2);
        strategy.add(view3);
        strategy.add(view4);
    });

    afterEach(function () {
    });

    describe('add', function () {
        it('adds a searchable at the correct index', function () {
            let view5 = getView(5);
            strategy.add(view5);
            expect(strategy.views.length).toEqual(5);
            expect(strategy.views[2]).toEqual(view5);
        });

        it('adds a searchable with same indexValue after all existing views with same indexValue', function () {
            let view5 = getView(6)
            strategy.add(view5);
            expect(strategy.views.length).toEqual(5);
            expect(strategy.views[3]).toEqual(view5);

            let view6 = getView(9);
            strategy.add(view6);
            expect(strategy.views.length).toEqual(6);
            expect(strategy.views[5]).toEqual(view6);

            let view7 = getView(9);
            strategy.add(view7);
            expect(strategy.views.length).toEqual(7);
            expect(strategy.views[6]).toEqual(view7);
        });
    });

    describe('remove', function () {
        it('deletes a searchable view', function () {
            strategy.remove(view3);
            expect(strategy.views.length).toEqual(3);
        });

        it('deletes the correct view if multiple exist with same indexValue', function () {
            let view5 = getView(6);
            strategy.add(view5);
            expect(strategy.views.length).toEqual(5);
            strategy.remove(view5);
            expect(strategy.views.length).toEqual(4);

            expect(strategy.views).toEqual([
                view1, view2, view3, view4
            ]);

            strategy.add(view5);
            expect(strategy.views.length).toEqual(5);
            strategy.remove(view3);
            expect(strategy.views.length).toEqual(4);

            expect(strategy.views).toEqual([
                view1, view2, view5, view4
            ]);
        });

        it('doesn\'t break if we remove an unknown view', function () {
            // try to delete unknown indexValue
            let unknownIndexView = getView(10);
            strategy.remove(unknownIndexView);
            expect(strategy.views.length).toEqual(4);

            // try to delete known indexValue, but with unknown view
            let unknownView = getView(6);
            strategy.remove(unknownView);
            expect(strategy.views.length).toEqual(4);
        });
    });

    describe('lastLessThan', function () {
        it('finds a view at index smaller than', function () {
            let actual = strategy.lastLessThan(2);
            expect(actual).toEqual(view1);
            actual = strategy.lastLessThan(7);
            expect(actual).toEqual(view3);
        });

        it('does not return view with exactly matching indexValue if it exists', function () {
            let actual = strategy.lastLessThan(6);
            expect(actual).not.toEqual(view3);
            expect(actual).toEqual(view2);
        });
    });

    describe('equalToOrLastLessThan', function () {
        it('finds a view at index if it exists', function () {
            let actual = strategy.equalToOrLastLessThan(1);
            expect(actual).toEqual(view1);
            actual = strategy.equalToOrLastLessThan(3);
            expect(actual).toEqual(view2);
        });

        it('finds a view at index smaller than if indexValue does not exist', function () {
            let actual = strategy.equalToOrLastLessThan(2);
            expect(actual).toEqual(view1);
        });
    });

    describe('firstNotLessThan', function () {
        it('returns view with exactly matching indexValue if it exists', function () {
            let actual = strategy.firstNotLessThan(1);
            expect(actual).toEqual(view1);
            actual = strategy.firstNotLessThan(3);
            expect(actual).toEqual(view2);
        });

        it('returns first view with exactly matching indexValue if multiple exists', function () {
            let newerView = getView(6);
            strategy.add(newerView);
            let actual = strategy.firstNotLessThan(6);
            expect(actual).toEqual(view3);
        });
    });

    describe('lastNotGreaterThan', function () {
        it('returns view with exactly matching indexValue if it exists', function () {
            let actual = strategy.lastNotGreaterThan(1);
            expect(actual).toEqual(view1);
            actual = strategy.lastNotGreaterThan(3);
            expect(actual).toEqual(view2);
        });

        it('returns last view with exactly matching indexValue if multiple exists', function () {
            let newerView = getView(6);
            strategy.add(newerView);
            let actual = strategy.lastNotGreaterThan(6);
            expect(actual).toEqual(newerView);
        });
    });

    describe('firstGreaterThan', function () {
        it('finds first view with indexValue greater than', function () {
            let actual = strategy.firstGreaterThan(1);
            expect(actual).toEqual(view2);
            actual = strategy.firstGreaterThan(3);
            expect(actual).toEqual(view3);
        });

        it('does not return view with exactly matching indexValue if it exists', function () {
            let actual = strategy.firstGreaterThan(6);
            expect(actual).not.toEqual(view3);
            expect(actual).toEqual(view4);
        });
    });
});
