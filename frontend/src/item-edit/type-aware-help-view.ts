import {
    find, intersection, extend, isNumber, isBoolean, isString, isDate, chain,
} from 'lodash';
import { CompositeView } from '../core/view';
import { rdfs, xsd } from '../common-rdf/ns';
import interpretText from '../utilities/interpret-text';
import AllowedTypesListHelpText from './allowed-type-list-view';
import DetectedTypeHelpText from './detected-type-help-view';
import Graph from '../common-rdf/graph';
import Node from '../common-rdf/node';
import { FlatSingleValue } from '../common-rdf/json';
import { asLD, Native } from '../common-rdf/conversion';
import Model from '../core/model';

import typeAwareHelpTemplate from './type-aware-help-template';
import { getRdfSuperProperties } from '../utilities/linked-data-utilities';

// Selector of template element displaying "all types allowed" help text.
const allTypesAllowedHelp = 'p.help:first-of-type';
// Selector of template element displaying "no matching type" help text.
const noMatchHelp = 'p.help.is-danger';

const semiCompatibleTypes: [(v: any) => boolean, string[]][] = [
    [isBoolean, [xsd.boolean]],
    [isNumber, [
        xsd.double, xsd.float, xsd.byte, xsd.unsignedByte, xsd.short,
        xsd.unsignedShort, xsd.int, xsd.unsignedInt, xsd.long,
        xsd.unsignedLong, xsd.integer, xsd.nonNegativeInteger,
        xsd.nonPositiveInteger, xsd.positiveInteger, xsd.negativeInteger,
        xsd.decimal,
    ]],
    [isDate, [xsd.dateTime, xsd.date]],
    [isString, [
        xsd.string, xsd.normalizedString, xsd.token, xsd.language,
        xsd.base64Binary,
    ]],
];

function findType(range: Graph, value: any): string {
    const available = range.map((n) => n.id as string);
    let singleType;
    if (range.length === 1) {
        singleType = available[0];
        if (singleType !== rdfs.Literal) return singleType;
    }
    const matches = find(semiCompatibleTypes, ([check]) => check(value));
    const matchedTypes = matches ? matches[1] : [];

    if (!range.length || singleType === rdfs.Literal) {
        return matchedTypes[0];
    }
    return intersection(matchedTypes, available)[0];
}

export default class TypeAwareHelpText extends CompositeView<Node> {
    collection: Graph;
    allowedTypesList: AllowedTypesListHelpText;
    detectedTypeHelp: DetectedTypeHelpText;
    range: Graph;
    model: Node;

    initialize() {
        this.range = this.collection || new Graph();
        this.detectedTypeHelp = new DetectedTypeHelpText({
            model: new Model(),
        });
        this.allowedTypesList = new AllowedTypesListHelpText({
            collection: this.range,
        });
        this.render().updateRange(this.model);
    }

    renderContainer(): this {
        this.$el.html(this.template(this));
        this.$(noMatchHelp).hide();
        this.$(allTypesAllowedHelp).hide();
        this.detectedTypeHelp.$el.hide();
        return this;
    }

    setHelpText(jsonld: FlatSingleValue): this {
        if (!jsonld["@type"]) {
            jsonld["@type"] = findType(this.range, jsonld["@value"]);
        }
        this.detectedTypeHelp.model.set({ jsonld });
        this.$(noMatchHelp).hide();
        return this;
    }

    updateRange(predicate: Node): this {
        this.$(allTypesAllowedHelp).hide();
        this.allowedTypesList.$el.hide();
        if (!predicate) {
            this.range.reset();
            return this;
        }
        const allProperties = getRdfSuperProperties([predicate]);
        this.range.set(
            chain(allProperties)
            .map(n => n.get(rdfs.range) as Node[])
            .flatten()
            .compact()
            .value()
        );
        if (!this.range.length || this.range.get(rdfs.Literal)) {
            this.$(allTypesAllowedHelp).show();
        } else {
            this.allowedTypesList.$el.show();
        }
        return this;
    }

    updateHelpText(val: string): void {
        const interpretation = interpretText(val, this.range);
        this.$(noMatchHelp).hide();
        if (interpretation) {
            this.detectedTypeHelp.model.set(interpretation);
            this.detectedTypeHelp.$el.show();
        } else {
            if (val) {
                this.$(noMatchHelp).show();
            }
            this.detectedTypeHelp.$el.hide();
        }
    }
}
extend(TypeAwareHelpText.prototype, {
    className: "rit help-text",
    template: typeAwareHelpTemplate,
    subviews: [
        {
            view: "allowedTypesList",
            selector: noMatchHelp,
            method: "before",
        },
        "detectedTypeHelp",
    ],
});
