import PersonModel from './person-model';

describe('PersonModel', function() {
    beforeEach(function() {
        this.model = new PersonModel();
    });
    describe('.swapProperties', function() {
        it('swaps properties', function() {
            expect(this.model.get('name')).toBe('Alex');
            expect(this.model.get('email')).toBe('alex@alex.alex');
            expect(this.model.swapProperties()).toBe(this.model);
            expect(this.model.get('name')).toBe('alex@alex.alex');
            expect(this.model.get('email')).toBe('Alex');
        });
    });
});
