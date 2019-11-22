
export function singleNumber(nodeIndex: number, characterIndex: number): number {
    return nodeIndex + 2 - (1 / (characterIndex + 1));
}

// function singleNumber(mostSignificant: number, moreSignificant: number, ...lessSignificant: number[]): number {
//     if (moreSignificant == null) return mostSignificant + 1;
//     const tail = singleNumber(moreSignificant, ...lessSignificant);
//     return -(1 / tail) + 2 + mostSignificant;
// }
