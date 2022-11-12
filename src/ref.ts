import { reactive } from "./reactive";

export function ref(
  val: any
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

function toRef<T>(obj: T, key: keyof T) {
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

function toRefs<T>(obj: T) {
  const ret: Record<string, any> = {};
  for (const key in obj) {
    ret[key] = toRef(obj, key);
  }
  return ret;
}

function proxyRefs<T extends Record<string | number | symbol, any>>(target: T) {
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