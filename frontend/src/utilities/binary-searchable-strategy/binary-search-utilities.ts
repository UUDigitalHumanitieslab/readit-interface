export function singleNumber(mostSignificant: number, moreSignificant?: number, ...lessSignificant: number[]): number {
    if (moreSignificant == null) return mostSignificant + 1;
    const tail = singleNumber(moreSignificant, ...lessSignificant);
    return -(1 / tail) + 2 + mostSignificant;
}
