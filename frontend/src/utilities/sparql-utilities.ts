
import { map } from "lodash";

// Callback used with `_.map` below to convert `nsTable` to the format that
// `../sparql/query-templates/preamble-template.hbs` requires.
const explodeNs = (prefix, label) => ({ label, prefix });

export interface nsTable {
    [abbreviation: string]: string;
}

export function formatNamespaces(ns: nsTable) {
    return map(ns, explodeNs);
}
