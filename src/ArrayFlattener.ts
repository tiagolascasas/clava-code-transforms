import { FunctionJp, Param, Varref } from "@specs-feup/clava/api/Joinpoints.js"
import IdGenerator from "@specs-feup/lara/api/lara/util/IdGenerator.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";


export class ArrayFlattener {
    constructor() { }

    public flattenAllInFunction(fun: FunctionJp): number {
        for (const param of Query.searchFrom(fun, Param)) {
            this.flattenParameterArray(fun, param);
        }

        const id = IdGenerator.next("foo");
        return 0;
    }

    public flattenParameterArray(fun: FunctionJp, arrayParam: Param): void {

    }

    public flattenLocalArray(fun: FunctionJp, arrayVar: Varref): void {

    }
}