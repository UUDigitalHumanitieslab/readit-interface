import { BinarySearchStrategy, BinarySearchableView } from './binary-search-strategy';
import View from '../../core/view';

describe('BinarySearchStrategy', function () {

    let strategy: BinarySearchStrategy;
    let view1 = new View();
    let view2 = new View();
    let view3 = new View();
    let view4 = new View();

    beforeEach(function () {
        strategy = new BinarySearchStrategy();
        strategy.add({ indexValue: 1, view: view1 });
        strategy.add({ indexValue: 3, view: view2 });
        strategy.add({ indexValue: 6, view: view3 });
        strategy.add({ indexValue: 9, view: view4 });
    });

    afterEach(function () {
    });

    describe('add', function () {
        it('adds a searchable at the correct index', function () {
            let view5 = new View();
            strategy.add({ indexValue: 5, view: view5 });
            expect(strategy.searchables.length).toEqual(5);
            expect(strategy.searchables[2].view).toEqual(view5);
        });

        it('adds a searchable with same indexValue before existing searchable', function () {
            let view5 = new View();
            strategy.add({ indexValue: 6, view: view5 });
            expect(strategy.searchables.length).toEqual(5);
            expect(strategy.searchables[2].view).toEqual(view5);

            let view6 = new View();
            strategy.add({ indexValue: 9, view: view6 });
            expect(strategy.searchables.length).toEqual(6);
            expect(strategy.searchables[4].view).toEqual(view6);

            let view7 = new View();
            strategy.add({ indexValue: 9, view: view7 });
            expect(strategy.searchables.length).toEqual(7);
            expect(strategy.searchables[4].view).toEqual(view7);
        });
    });

    describe('getClosestTo', function () {
        it('finds a view at index closest to', function () {
            let actual = strategy.getClosestTo(2);
            expect(actual).toEqual(view1);
            actual = strategy.getClosestTo(7);
            expect(actual).toEqual(view3);
        });

        it('returns view with exactly matching indexValue if it exists', function() {
            let actual = strategy.getClosestTo(6);
            expect(actual).toEqual(view3);
        });

        it('doesn\'t care if an indexValue exists multiple time', function() {
            let view5 = new View();
            strategy.add({ indexValue: 6, view: view5});
            let actual = strategy.getClosestTo(6);
            expect(actual).toEqual(view5);
        });
    });
});
