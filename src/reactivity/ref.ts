import { reactive, shallowReactive } from "./reactive";

export function ref<T>(
  val: T
) {
  const wrapper = {
    value: val,
  };
  Object.defineProperty(wrapper, "__v_isRef", {
    value: true,
    enumerable: false,
  });
  return reactive(wrapper);
}

export function toRef<T>(obj: T, key: keyof T) {
  const wrapper = {
    get value() {
      return obj[key];
    },
    set value(val) {
      obj[key] = val;
    },
  };
  Object.defineProperty(wrapper, "__v_isRef", {
    value: true,
    enumerable: false,
  });
  return wrapper;
}

export function toRefs<T>(obj: T) {
  const ret: Record<string, any> = {};
  for (const key in obj) {
    ret[key] = toRef(obj, key);
  }
  return ret;
}

export function proxyRefs<T extends Record<string | number | symbol, any>>(target: T) {
  return new Proxy(target, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver);
      return value.__v_isRef ? value.value : value;
    },
    set(target, key, newV, receiver) {
      const value = target[key];
      if (value.__v_isRef) {
        value.value = newV;
        return true;
      }
      return Reflect.set(target, key, newV, receiver);
    },
  });
}

export function shallowRef<T>(val: T) {
  const wrapper = {
    value: val,
  };
  Object.defineProperty(wrapper, "__v_isShallowRef", {
    value: true,
    enumerable: false,
  });
  return shallowReactive(wrapper)
}
