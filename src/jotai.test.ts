import { test, expect } from "vitest";
import { atom } from "./jotai";

function randomInt(min: number, max: number) {
  min = min ?? 1;
  max = max ?? 8_000;
  return min + Math.floor(Math.random() * (max - min));
}

function repeatTest(testFn: () => void, iterations: number = 10) {
  for (let i = 0; i < iterations; i++) testFn();
}

test("simple int", () => {
  expect(atom(2).get()).toEqual(2);
});

test("basic types work", () => {
  repeatTest(async () => {
    const expected = randomInt();
    const actualAtomInt = atom(expected);

    expect(actualAtomInt.get()).toEqual(expected);

    //modiy and test
    const expectedNewValue = randomInt();

    await actualAtomInt.set(expectedNewValue);

    expect(actualAtomInt.get()).toEqual(expectedNewValue);

    actualAtomInt.subscribe((newValue) => {
      console.log([expectedNewValue, actualAtomInt.get()]);
      expect(actualAtomInt.get()).toEqual(expectedNewValue);
      expect(newValue).toEqual(expectedNewValue);
    });
  });
});

test("primise work", () => {
  repeatTest(async () => {
    const makePromise = () => {
      const res = randomInt();
      return async () => res;
    };
    const expectedPromise = makePromise();
    const actualAtomPromise = atom(expectedPromise);

    actualAtomPromise.subscribe(async (actual) => {
      console.log("proomise", [actual, await expectedPromise()]);
      expect(actual).toEqual(await expectedPromise());
    });
  });
});

test("function expressions", () => {
  repeatTest(async () => {
    const atomA = atom("A" + randomInt());
    const atomB = atom("_" + randomInt() + "B");
    const str = ": smile";

    const atomC = await atom((get) => get(atomA) + "__" + get(atomB) + str);

    // it appears compute is async thus if we want to retriev a value immediately on get
    // then we must await before the get call

    expect(atomA.get()).not.toBe(null);
    expect(atomB.get()).not.toBe(null);

    const expectedRes = () => atomA.get() + "__" + atomB.get() + str;

    console.log("function expressions", [atomC.get(), expectedRes()]);
    expect(atomC.get()).toEqual(expectedRes());

   const unsubRes= atomC.subscribe(async (cRes) => {
      console.log([cRes, atomA.get() + atomB.get() + str], "\n\n");
        // expect(cRes).toEqual(atomA.get() + atomB.get() + str);
    });

    
    
    // make 10 changes to atomA
    for (let i = 0; i < 10; i++) {
        const newA = "A_change_" + randomInt();
        const newB = "B_" + randomInt();
    
        await atomA.set(newA);
        const unsubA = atomC.subscribe((cRes) => {
          expect(cRes).includes(newA);
          unsubA();
        });
    
        console.log("atomA.set.fired", [newA]);
    
        await atomB.set(newB);
        const unsubB = atomC.subscribe((cRes) => {
          expect(cRes).includes(newB);
          unsubB();
        });
    
        console.log("atomB.set.fired", [newB]);
        expect(atomA.get()).toEqual(newA);
        expect(atomB.get()).toEqual(newB);
        await true;
        expect(atomC.get()).toEqual(expectedRes());
    }
  }, 10);
});
