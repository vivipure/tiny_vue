import { it, describe, vi, expect } from "vitest";
import { reactive } from "../src/reactive";


describe('reactive test', () => {
    it('object reactive', () => {
        const original = {
            foo: 1
        }
        const reactiveObj = reactive(original)
        expect(reactiveObj).not.toBe(original)
        expect(reactiveObj.foo).toBe(original.foo)
        reactiveObj.foo = 2
        expect(reactiveObj.foo).toBe(original.foo)

    })
})