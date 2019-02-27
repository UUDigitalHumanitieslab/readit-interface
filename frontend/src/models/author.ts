import FancyModel from '../core/fancy-model';

export default class Author extends FancyModel {
    id: number
    name: string
    someExternalId: string
}