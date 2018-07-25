// This module only exists to illustrate what to do if you need to
// customize some core type.

import bb from 'backbone'

export type FancynessLevel = 'low' | 'moderate' | 'high';

export default class FancyModel extends bb.Model {
    level: FancynessLevel = 'moderate';
}
