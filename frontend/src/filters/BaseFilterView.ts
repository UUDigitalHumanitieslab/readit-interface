import View from '../core/view';
import { BaseFilter } from './baseFilter';

export abstract class BaseFilterView extends View {
    abstract filter: BaseFilter;

    /**
     * Call this method when the value(s) of your child FilterView change
     */
    changed(): void {
        this.trigger('changed');
    }
}