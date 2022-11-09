import { it, describe,vi, expect } from "vitest";
import { effect, reactive } from "../src/effect";


describe('effect test suits', () => {
    it('effect 函数读取值后， 改变值可以触发副作用函数', () => {
        const obj = reactive({
            a: 1,
            b: 2
        })
        const fn = vi.fn()
        effect(() => {
            console.log(obj.a)
            fn()
        })
        obj.a = 2
        expect(fn).toBeCalledTimes(2)
    })

    it('effect 函数声明后，如果设置的值不改变，则不触发副作用函数', () => {
        const obj = reactive({
            a: 1,
            b: 2
        })
        const fn = vi.fn()
        effect(() => {
            console.log(obj.a)
            fn()
        })
        obj.a = 1
        expect(fn).toBeCalledTimes(1)
    })

    it('effect 函数声明后，如果改动其他的属性，则不触发副作用函数', () => {
        const obj = reactive({
            a: 1,
            b: 2
        })
        const fn = vi.fn()
        effect(() => {
            console.log(obj.a)
            fn()
        })
        obj.b = 1
        expect(fn).toBeCalledTimes(1)
    })

    it('effect 支持嵌套使用', () => {
        const obj = reactive({
            a: 1,
            b: 2
        })
        const fn1 = vi.fn()
        const fn2 = vi.fn()
        effect(() => {
            obj.a
            effect(() => {
                obj.b
                fn2()
            })
            fn1()
        })
        obj.a = 2 // fn1 ,fn2同时出发

        obj.b = 4 // fn2 触发
        // fn1 触发次数： 初始1+a1 = 2
        expect(fn1).toBeCalledTimes(2)
        // fn2 出发次数： 初始1 + a 1 + b 1 = 3
        expect(fn2).toBeCalledTimes(3)
    })

})
