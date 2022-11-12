import { it, describe, vi, expect } from "vitest";
import { effect } from "../src/reactivity";
import { reactive, shallowReactive } from "../src/reactivity";

describe("effect test suits", () => {
  it("effect 函数读取值后， 改变值可以触发副作用函数", () => {
    const obj = reactive({
      a: 1,
      b: 2,
    });
    const fn = vi.fn();
    effect(() => {
      console.log(obj.a);
      fn();
    });
    obj.a = 2;
    expect(fn).toBeCalledTimes(2);
  });

  it("effect 函数声明后，如果设置的值不改变，则不触发副作用函数", () => {
    const obj = reactive({
      a: 1,
      b: 2,
    });
    const fn = vi.fn();
    effect(() => {
      console.log(obj.a);
      fn();
    });
    obj.a = 1;
    expect(fn).toBeCalledTimes(1);
  });

  it("effect 函数声明后，如果改动其他的属性，则不触发副作用函数", () => {
    const obj = reactive({
      a: 1,
      b: 2,
    });
    const fn = vi.fn();
    effect(() => {
      console.log(obj.a);
      fn();
    });
    obj.b = 1;
    expect(fn).toBeCalledTimes(1);
  });

  it("effect 支持深度响应式", () => {
    const obj = reactive({
      foo: {
        bar: 1,
      },
    });
    const fn = vi.fn();

    effect(() => {
      console.log(obj.foo.bar);
      fn();
    });

    obj.foo.bar = 2;
    expect(fn).toBeCalledTimes(2);
  });

  it("shallowEffect 只支持浅响应，深层级的数据更改不会触发副作用", () => {
    const obj = shallowReactive({
      foo: {
        bar: 1,
      },
    });
    const fn = vi.fn();

    effect(() => {
      console.log(obj.foo.bar);
      fn();
    });

    obj.foo.bar = 2;
    expect(fn).toBeCalledTimes(1);
  });

  it("数组改变触发 effect", () => {
    const arr = reactive([1]);
    const fn = vi.fn();

    effect(() => {
      console.log(arr[0]);
      fn();
    });

    arr[0] = 2;
    expect(fn).toBeCalledTimes(2);
  });
});
