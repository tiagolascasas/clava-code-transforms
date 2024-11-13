import Query from "@specs-feup/lara/api/weaver/Query.js";
import { ArrayFlattener } from "../src/ArrayFlattener.js";
import { FoldingPropagationCombiner } from "../src/constfolding/FoldingPropagationCombiner.js";
import { AstDumper } from "./AstDumper.js";
import { FunctionJp } from "@specs-feup/clava/api/Joinpoints.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";
import { StructDecomposer } from "../src/StructDecomposer.js";

const dumper = new AstDumper();
console.log(dumper.dump());

const arrayFlattener = new ArrayFlattener();
arrayFlattener.flattenAll();

Clava.rebuild();

const folder = new FoldingPropagationCombiner();
for (const fun of Query.search(FunctionJp)) {
    folder.doPassesUntilStop(fun);
}

Clava.rebuild();

const structs = [
    //"Triangle_3D",
    //"Triangle_2D",
    "CandidatePixel",
    //"Pixel"
]

const structDecomp = new StructDecomposer();
for (const struct of structs) {
    structDecomp.decomposeByName(struct);
}

Clava.rebuild();