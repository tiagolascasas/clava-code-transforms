# Clava Code Transforms

A set of advanced code transformations for the [Clava C/C++ source-to-source compiler](https://github.com/specs-feup/clava).

## How to install

Assuming you already have a [Clava-based NPM project](https://github.com/specs-feup/clava-project-template) setup, you can follow these steps:

1. Create an NPM workspace for your project and this repository (replace with your project's specifics accordingly):

```bash
mkdir clava-workspace
mv /path/to/your/project /clava-workspace
cd clava-workspace
git clone https://github.com/tiagolascasas/clava-code-transforms
cat <<EOF > package.json
{
  "name": "clava-workspace",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "clava-code-transforms",
    "your-project"
}
EOF
npm install
```

2. Build the package:

```bash
cd clava-code-transforms
npm run build
```

3. Include the package in your own project by adding it to the "dependencies" list in your package.json:

```json
{
    //...
    "dependencies": {
        "@specs-feup/clava": "3.0.1",
        "clava-code-transforms": "^1.0.0",
        //...
    },
    //...
}
```

## Available transformations

### Array flattening

Flattens an N-dimensional array into a single dimension at the function level, for instance:

```C
int sum_matrix(int A[100][100]) {
    int n = 0;
    for (int i = 0; i < 100; i++) {
        for (int j = 0; j < 100; j++) {
            n += A[i][j];
        }
    }
}

// is transformed into...
int sum_matrix(int A[10000]) {
    int n = 0; 
    for (int i = 0; i < 100; i++) {
        for (int j = 0; j < 100; j++) {
            n += A[i * 100 + j];
        }
    }
}
```

Usage example:

```TypeScript
import ArrayFlattener from "clava-code-transforms/ArrayFlattener";

const fun = Query.search(FunctionJp, {name: "sum_matrix"}).first()!;

const flattener = new ArrayFlattener();
const n = flattener.flattenAllInFunction(fun);

console.log(`Flattened ${n} arrays in function ${fun.name}`);
```

### Constant folding and propagation

Applies constant folding and propagation to a function, repeatedly, until there are either no more opportunities, or it reaches a maximum number of passes. For instance:

```C
int foo(int a, int b) {
    int c = 1 + 2 + 3;
    int d = a + c;
    int e = c * 2;
    return e + d;
}

// is transformed into...
int foo(int a, int b) {
    int c = 6;
    int d = a + 6;
    int e = 12;
    return 12 + d;
}
```

Usage example:

```TypeScript
import FoldingPropagationCombiner from "clava-code-transforms/FoldingPropagationCombiner";

const fun = Query.search(FunctionJp, {name: "sum_matrix"}).first()!;

const foldProg = new FoldingPropagationCombiner(true);
const nPasses = foldProg.doPassesUntilStop(fun);

// alternatively, specify the minimum and maximum number of passes:
//const nPasses = foldProg.doPassesUntilStop(fun, 3, 20);

console.log(`Applied constant folding and propagation in ${nPasses}`);
```

### Loop characterization

Not a transformation per se, but an estimator for the number of iterations of a loop, as long as it can be known at compile time:

```C
void static_loop(int *A) {
    for (int i = 0; i < 100; i++) {
        A[i] = A[i] * 2;
    }
}

void dynamic_loop(int *A, int n) {
    for (int i = 0; i < n; i++) {
        A[i] = A[i] * 2;
    }
}
```

Usage example:

```TypeScript
import LoopCharacterizer from "clava-code-transforms/LoopCharacterizer";

const lc = new LoopCharacterizer();

for (const loop of Query.search(Loop)) {
    const res = lc.characterize(loop);

    console.log(res);
}
```

With the output, for the first loop:

```json
{
    "isValid": true,
    "inductionVar": "i",
    "boundVar": "imm(100)",
    "incrementVar": "imm(1)",
    "initialVal": 0,
    "bound": 100,
    "increment": 1,
    "op": "+",
    "tripCount": 100
}
```

### Function outlining

Applies function outlining, i.e., it excises a code region into its own function, and replaces the region with a call to that function. For instance:

```C
void foo(int *A) {
    int x = 0;
    #pragma clava begin_outline 
    int y = 5;
    for (int i = 0; i < 100; i++) {
        A[i] = x + y * i;
    }
    #pragma clava end_outline
    A[0] = i;
}

// is transformed into...
void outlined_region(int *A, int x, int *i) {
    int y = 5;
    for ((*i) = 0; (*i) < 100; (*i)++) {
        A[i] = x + y * (*i);
    }
}

void foo(int *A) {
    int x = 0; 
    int i;
    outlined_fun(A, x, &i);
    A[0] = i;
}
```

Usage example:

```TypeScript
import Outliner from "clava-code-transforms/Outliner";

const start = Query.search(WrapperStmt, {code: "#pragma clava begin_outline"}).first()!;
const end = Query.search(WrapperStmt, {code: "#pragma clava end_outline"}).first()!;

const outliner = new Outliner();
outliner.setDefaultPrefix("outlined_");
outliner.setVerbosity(false);

outliner.outlineWithName(start, end, "region");
```

### Struct decomposition

Decomposes a struct variable/ref into separate variables/refs representing their fields, updating function calls and all expressions accordingly. If you use arrays of structs, you must ensure they are 1D (i.e., run the Array Flattening transformation beforehand if you need to):

```C
typedef struct {
    float x;
    float y;
} Point2D;

void foo(Point2D point)  { /*...*/ }

void bar(Point2D *point)  { /*...*/ }

int main() {
    Point2D point;
    Point2D points[2] = {1.0, 2.0, 3.0, 4.0};

    point.x = 40.0;
    points[1].y = 50.0

    foo(point);
    bar(&point);
}

// is transformed into...
void foo(float point_x, float point_y) { /*...*/ }

void bar(float *point_x, float *point_y) { /*...*/ }

int main() {
    float point_x = 1.0;
    float point_y = 2.0;
    float point_x[2] = {1.0, 3.0};
    float point_y[2] = {2.0, 4.0};

    point_x = 40.0;
    points_y[1] = 50.0;

    foo(point_x, point_y);
    bar(&point_x, &point_y);
}
```

Usage example:

```TypeScript
import StructDecomposer from "clava-code-transforms/StructDecomposer";

const decomp = new StructDecomposer(true /* false to enable silent mode*/);
const structNames = decomp.decomposeAll();
```

### Function voidification

Ensures that a given function returns void, for instance:

```C
int foo(int a, int b) {
    return a + b;
}

// is transformed into...
void foo(int a, int b, int* rtr_val) {
    *rtr_val = a + b;
}
```

Usage example:

```TypeScript
import Voidifier from "clava-code-transforms/Voidifier";

const fun = Query.search(FunctionJp, {name: "foo"}).first()!;

const vf = new Voidifier();
vf.voidify(fun, "rtr_val");
```
