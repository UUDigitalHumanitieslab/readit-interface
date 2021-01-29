type Deparam = (query: string) => any;

declare const deparam: Deparam;
export default deparam;

declare global {
    interface JQueryStatic {
        deparam: Deparam;
    }
}
