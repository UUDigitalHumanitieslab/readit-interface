import ExampleModel from './example-model';

describe('ExampleModel', function() {
    beforeEach(function() {
        this.model = new ExampleModel();
        this.model.set(this.model.defaults());
    });
    describe('.swapProperties', function() {
        it('swaps properties', function() {
            expect(this.model.get('property1')).toBe('ant');
            expect(this.model.get('property2')).toBe('bee');
            expect(this.model.swapProperties()).toBe(this.model);
            expect(this.model.get('property1')).toBe('bee');
            expect(this.model.get('property2')).toBe('ant');
        });
    });
});
