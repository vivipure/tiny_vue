import { ITERATE_KEY, TriggerType } from "./constant";
import { track, trigger } from "./effect";
import { isEqual } from "../utils/utils";

export const ReativeFlags = {
  REACTIVE: Symbol("__v_reactive"),
  RAW: Symbol("__v_raw"),
  READONLY: Symbol("__v_readyonly"),
} as const;

type KeyType = string | symbol ;


type Target = {
} & Record<KeyType,any>


function createReactive<T extends Target >(
  obj: T,
  isShallow: boolean = false,
  isReadOnly: boolean = false
): T {
  return new Proxy(obj, {
    get(target: T, key: KeyType, receiver) {
      if (key === ReativeFlags.RAW) {
        return target;
      }
      if (key === ReativeFlags.REACTIVE) {
        return !isReadOnly;
      }
      if (key === ReativeFlags.READONLY) {
        return isReadOnly;
      }

      if (!isReadOnly) {
        track(target, key);
      }

      const res = Reflect.get(target, key, receiver);
      if (isShallow) {
        return res;
      }
      // 读取数据是对象时， 将结果包裹成 响应式数据并返回，以支持深响应
      if (typeof res === "object" && res !== null) {
        return isReadOnly ? readonly(res) : reactive(res);
      }

      return res;
    },
    set(target, key: KeyType, value, receiver) {
      if (isReadOnly) {
        console.warn(`属性 ${String(key)} 只读`);
        return true;
      }

      // 判断触发类型，是设置值，还是新增值
      const triggerType = Object.prototype.hasOwnProperty.call(target, key)
        ? TriggerType.UPDATE
        : TriggerType.ADD;
      // 获取老的值
      const oldValue = target[key];

      const res = Reflect.set(target, key, value, receiver);

      // 处理原型引起的更新，只有receiver 是target时才触发
      if (target === receiver[ReativeFlags.RAW]) {
        // 比较
        if (!isEqual(oldValue, value)) {
          trigger(target, key, triggerType);
        }
      }

      return res;
    },
    ownKeys(target) {
      track(target, ITERATE_KEY);
      return Reflect.ownKeys(target);
    },
    deleteProperty(target, key: KeyType) {
      if (isReadOnly) {
        console.warn(`属性 ${String(key)} 只读`);
        return true;
      }

      const hadKey = Object.prototype.hasOwnProperty.call(target, key);
      const res = Reflect.deleteProperty(target, key);
      if (hadKey && res) {
        trigger(target, key, TriggerType.DELETE);
      }

      return res;
    },
  });
}

export function shallowReactive(obj: Record<string | symbol, any>) {
  return createReactive(obj, true);
}

export function reactive<T extends Record<string | symbol, any>>(obj: T) {
  return createReactive(obj, false);
}

export function readonly(obj: Record<string | symbol, any>) {
  return createReactive(obj, false, true);
}
export function shallowReadonly(obj: Record<string | symbol, any>) {
  return createReactive(obj, true, true);
}

export function isReactive(valule: any) {
  return !!valule[ReativeFlags.REACTIVE];
}
export function toRaw(valule: any) {
  if (!valule[ReativeFlags.RAW]) {
    return valule;
  }

  return valule[ReativeFlags.REACTIVE];
}
