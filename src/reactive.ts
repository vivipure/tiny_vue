import { ITERATE_KEY, TriggerType } from "./constant";
import { track, trigger } from "./effect";
import { isEqual } from "./utils";

export const ReativeFlags = {
  REACTIVE: "__v_reactive",
  RAW: "__v_raw",
  READONLY: "__v_readyonly",
};

function createReactive(
  obj: Record<string | symbol, any>,
  isShallow: boolean = false,
  isReadOnly: boolean = false
) {
  return new Proxy(obj, {
    get(target, key, receiver): any {
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
      if (typeof res === "object" && typeof res !== null) {
        return isReadOnly ? readonly(res) : reactive(res);
      }

      return res;
    },
    set(target, key, value, receiver) {
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
    deleteProperty(target, key) {
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

export function reactive(obj: Record<string | symbol, any>) {
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
