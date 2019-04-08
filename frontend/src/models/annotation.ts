import FancyModel from '../core/fancy-model';

export default class Annotation extends FancyModel {
    id: number;
    startIndex: number;
    endIndex: number;
    creationDate: string;
    category: string;
    class: string;
}