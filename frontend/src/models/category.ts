import FancyModel from '../core/fancy-model';

export default class Category extends FancyModel {
    id: number;
    name: string;
    color: string;
    attributes: any[];
}