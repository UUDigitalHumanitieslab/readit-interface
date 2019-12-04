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

        it('adds a searchable with same indexValue after all existing searchables with same indexValue', function () {
            let view5 = new View();
            strategy.add({ indexValue: 6, view: view5 });
            expect(strategy.searchables.length).toEqual(5);
            expect(strategy.searchables[3].view).toEqual(view5);

            let view6 = new View();
            strategy.add({ indexValue: 9, view: view6 });
            expect(strategy.searchables.length).toEqual(6);
            expect(strategy.searchables[5].view).toEqual(view6);

            let view7 = new View();
            strategy.add({ indexValue: 9, view: view7 });
            expect(strategy.searchables.length).toEqual(7);
            expect(strategy.searchables[6].view).toEqual(view7);
        });
    });

    describe('remove', function () {
        it('deletes a searchable view', function () {
            strategy.remove({ indexValue: 6, view: view3 });
            expect(strategy.searchables.length).toEqual(3);
        });

        it('deletes the correct searchable view if multiple exist with same indexValue', function () {
            let view5 = new View();
            let searchable = { indexValue: 6, view: view5 };
            strategy.add(searchable);
            expect(strategy.searchables.length).toEqual(5);
            strategy.remove(searchable);
            expect(strategy.searchables.length).toEqual(4);

            expect(strategy.searchables).toEqual([
                { indexValue: 1, view: view1 },
                { indexValue: 3, view: view2 },
                { indexValue: 6, view: view3 },
                { indexValue: 9, view: view4 }
            ]);

            strategy.add(searchable);
            expect(strategy.searchables.length).toEqual(5);
            strategy.remove({ indexValue: 6, view: view3 });
            expect(strategy.searchables.length).toEqual(4);

            expect(strategy.searchables).toEqual([
                { indexValue: 1, view: view1 },
                { indexValue: 3, view: view2 },
                { indexValue: 6, view: view5 },
                { indexValue: 9, view: view4 }
            ]);
        });

        it('doesn\'t break if we remove an unknown view', function () {
            // try to delete unknown indexValue
            strategy.remove({ indexValue: 10, view: new View() });
            expect(strategy.searchables.length).toEqual(4);

            // try to delete known indexValue, but with unknown view
            strategy.remove({ indexValue: 6, view: new View() });
            expect(strategy.searchables.length).toEqual(4);
        });
    });

    describe('getClosestTo', function () {
        it('finds a view at index closest to', function () {
            let actual = strategy.getClosestTo(2);
            expect(actual).toEqual(view1);
            actual = strategy.getClosestTo(7);
            expect(actual).toEqual(view3);
        });

        it('returns view with exactly matching indexValue if it exists', function () {
            let actual = strategy.getClosestTo(6);
            expect(actual).toEqual(view3);
        });

        it('doesn\'t care if an indexValue exists multiple time', function () {
            let view5 = new View();
            strategy.add({ indexValue: 6, view: view5 });
            let actual = strategy.getClosestTo(6);
            expect(actual).toEqual(view3);
        });
    });
});
