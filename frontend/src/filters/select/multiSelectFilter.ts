import { BaseFilter } from '../baseFilter';
import { FilterTypes } from '../baseFilter';
import { SelectFilterOption } from './select-option';

export class MultiSelectFilter extends BaseFilter {
    name: string = '';
    type: FilterTypes = FilterTypes.MultiSelect;
    options: SelectFilterOption[]; 
    label: string;
    placeholder: string;
    value: string | number | string[] = undefined;

    //  ctor for MultiSelectFilter
    //  * @param name Name for the filter
    //  * @param label Label for the filter
    //  * @param options Options for the select filter
    //  * @param placeholder Defaults to 'Select an option'
    constructor(name: string, options: SelectFilterOption[], label: string, placeholder: string = 'Select an option') {
        super()
        this.name = name;
        this.options = options;
        this.label = label;
        this.placeholder = placeholder;
    }
}
