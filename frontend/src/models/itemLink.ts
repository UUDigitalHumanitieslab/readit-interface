import FancyModel from '../core/fancy-model';

export default class ItemLink extends FancyModel {
    id: number
    type: string
    to: number   
}