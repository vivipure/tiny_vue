import { ITERATE_KEY, TriggerType } from "./constant";

interface Fn {
  (...args: any[]): any;
}

interface EffectFn {
  (...args: any[]): any;
  deps: Set<EffectFn>[];
  options: EffectOptions;
}

interface EffectOptions {
  schedular?: Fn;
}

const effectMaps = new WeakMap();
const effectStack: EffectFn[] = [];
let activeEffect: null | EffectFn = null;

// 重置当前函数的依赖
function cleanupDeps(effectFn: EffectFn) {
  effectFn.deps.forEach((depSet) => {
    depSet.delete(effectFn);
  });
  effectFn.deps.length = 0;
}

// 收集依赖
export function track(
  target: Record<string | symbol, any>,
  key: string | symbol | number
) {
  if (!activeEffect) {
    return;
  }
  // 获取当前对象的 依赖 Map
  let depsMap: Map<any, Set<EffectFn>> | undefined = effectMaps.get(target);

  if (!depsMap) {
    effectMaps.set(target, (depsMap = new Map()));
  }

  //  当前对象 键值 的依赖数组
  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }

  // effect 函数存取 当前键值的依赖数组， 方便后续清除
  activeEffect.deps.push(deps);
  // 当前键值的依赖数组 存入 当前函数
  deps.add(activeEffect);
}
// 触发依赖
export function trigger(
  target: Record<string | symbol | number, any>,
  key: string | symbol | number,
  type: typeof TriggerType[keyof typeof TriggerType] = TriggerType.UPDATE
) {
  // 获取当前对象的依赖Map
  const depsMap: Map<any, Set<EffectFn>> = effectMaps.get(target);
  if (!depsMap) return;

  const copyEffects = new Set<EffectFn>();
  //   新增或者删除key 时，需要触发 迭代 依赖
  if (type === TriggerType.DELETE || type === TriggerType.ADD) {
    const iteratorEffects = depsMap.get(ITERATE_KEY);
    iteratorEffects &&
      iteratorEffects.forEach((fn) => {
        if (fn !== activeEffect) {
          copyEffects.add(fn);
        }
      });
  }

  // 当前对象键值的依赖数组
  const effects = depsMap.get(key);
  effects &&
    effects.forEach((fn) => {
      // 避免无限调用
      if (fn !== activeEffect) {
        copyEffects.add(fn);
      }
    });

  // 将依赖当前数据的函数全部触发
  // 为了避免触发函数时 往当前effects 中继续新增，所以拷贝一份进行遍历执行
  copyEffects.forEach((fn) => {
    // 可以调用自定义的schedular
    const callFN = fn.options.schedular || fn;
    callFN();
  });
}

// effect 函数
export function effect(fn: Fn, options: EffectOptions = {}) {
  const effectFn: EffectFn = () => {
    cleanupDeps(effectFn);
    activeEffect = effectFn;
    // 入栈，使用栈 实现嵌套
    effectStack.push(effectFn);
    fn();
    // 出栈
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
  };
  effectFn.deps = [];
  effectFn.options = options;
  effectFn();
}
