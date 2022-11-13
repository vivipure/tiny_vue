type IfEquals<X, Y, A = X, B = never> = (<T>() => T extends X ? 1 : 2) extends <
  T
>() => T extends Y ? 1 : 2
  ? A
  : B;

type WritableKeys<T> = {
  [P in keyof T]-?: IfEquals<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    P
  >;
}[keyof T];

type WriteableElementKey = WritableKeys<Element>;

type ReadonlyKeys<T> = {
  [P in keyof T]-?: IfEquals<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    never,
    P
  >;
}[keyof T];

function patchProps(el: Element, key: string, prevValue: any, nextValue: any) {
  if (nextValue != null) {
    if (shouldSetAsProps(el, key, nextValue)) {
      // 处理事件
      if (/^on/.test(key)) {
        const name = key.slice(2).toLocaleLowerCase();
        // @ts-ignore
        let invokers = el._vei || (el._vei = {});
        let invoker = invokers[key];
        if (nextValue) {
          if (!invoker) {
            // @ts-ignore
            invoker = el._vei[key] = function (e: Event) {
              // 事件发生时间 早于 事件绑定时间，则不执行函数
              if (e.timeStamp < invoker.attached) return;

              if (Array.isArray(invoker.val)) {
                invoker.value.forEach((fn: any) => fn.apply(this, arguments));
              } else {
                invoker.value(e);
              }
            };
            invoker.value = nextValue;
            //   函数被绑定的时间 高精度时间
            invoker.attached = performance.now();
            el.addEventListener(name, invoker);
          }
        } else if (invoker) {
          el.removeEventListener(name, invoker);
        }
      }

      if (key === "class") {
        el.className = nextValue || "";
      }

      const type = typeof el[key as keyof Element];

      if (type === "boolean" && nextValue === "") {
        // @ts-ignore
        el[key] = true;
        return;
      }

      // @ts-ignore
      el[key] = nextValue;
    } else {
      el.setAttribute(key, nextValue);
    }
  } else {
    // 删除属性
  }
}

function shouldSetAsProps(el: Element, key: string, value: any) {
  return true;
}

function insert(el: Element, parent: Element, anchor: Element | null) {
    parent.insertBefore(el, anchor)
}
