import Query from "lara-js/api/weaver/Query.js";
import { registerSourceCode } from "lara-js/jest/jestHelpers.js";
import { Loop } from "clava-js/api/Joinpoints.js";
import { LoopCharacterizer } from "./LoopCharacterizer.js";

const code = `
void loop_characterization(int A[100], int B[200], int C[300])
{
    int idx;
    int idx2 = 2;
    int idx3 = 3;

    for (int i = 0; i < 100; i++)
    {
        A[i] = 0;
    }
    for (int i = 0; i <= 200; i++)
    {
        B[i] = 0;
    }
    for (int i = 0; i <= 200; i *= 2)
    {
        B[i] = 0;
    }
    for (int i = 0; i <= 200; i = i * 2)
    {
        B[i] = 0;
    }
    for (int i = 0; 300 > i; i++)
    {
        C[i] = 0;
    }
    for (int i = 100; i > 0; i--)
    {
        A[i] = 0;
    }
    for (int i = 100; i >= 95; i--)
    {
        A[i] = 0;
    }
    for (int i = 0; i < 100; i++)
    {
        for (int j = 0; j < 200; j++)
        {
            for (int k = 0; k < 300; k++)
            {
                C[k] = A[i] + B[j];
            }
        }
    }
    for (int i = 4; i < 100; i += 2)
    {
        A[i] = 0;
    }
    for (int i = 4; i < 100; i = i + 2)
    {
        A[i] = 0;
    }
    for (idx = 1; idx < 100; idx++)
    {
        A[idx] = 0;
    }
    for (; idx2 < 100; idx2++)
    {
        A[idx2] = 0;
    }
}
`;

describe("Characterize loops", () => {
    registerSourceCode(code);

    const loops: Loop[] = [];
    for (const loop of Query.search(Loop)) {
        loops.push(loop);
    }
    it("Has loops", () => {
        expect(loops.length).toBeGreaterThan(0);
    });

    it("Loop 0", () => {
        const lcz = LoopCharacterizer.characterize(loops[0]);
        console.log(lcz);
        expect(lcz).toHaveProperty("inc");
    });
    it("Loop 13", () => {
        const lcz = LoopCharacterizer.characterize(loops[13]);
        console.log(lcz);
        expect(lcz).toHaveProperty("inc");
    });
});
