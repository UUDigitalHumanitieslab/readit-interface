export default class SelectFilterOption {
    value: string;
    label: string;
    className: string;
    
    constructor(value: string, label: string, className: string = '') {
        this.value = value;
        this.label = label;
        this.className = className;
    }
}
