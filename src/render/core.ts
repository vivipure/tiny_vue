const Text = Symbol();
const Comment = Symbol();
const Fragment = Symbol();

type VNode = {
  type: string;
  children: string | VNode[];
  props: Record<string, any>;
  el?: Element;
  key: any;
};

type RendererOptions = {
  createElement: (tag: string) => any;
  createText: (text: string) => any;
  setText: (el: any, text: string) => any;
  setElementText: (el: any, text: string) => any;
  insert: (el: any, parent: any, anchor?: any) => any;
  setAttribute: (el: any, key: string, val: any) => any;
  patchProps: (el: any, kye: string, prevValue: any, nextValue: any) => any;
};

export function createRenderer(options: RendererOptions) {
  const {
    createElement,
    createText,
    insert,
    setText,
    setElementText,
    patchProps,
  } = options;

  let currentVNode: null | VNode;
  //  渲染函数
  function render(vnode: VNode, container: HTMLElement & Record<string, any>) {
    if (vnode) {
      patch(currentVNode, vnode, container);
    } else {
      unmount(currentVNode!);
    }
  }

  function unmount(vnode: VNode) {
    // @ts-ignore
    if (vnode.type === Fragment) {
      // @ts-ignore
      vnode.children.forEach((c) => unmount(c));
    }

    const el = vnode.el;
    const parent = el!.parentNode;
    if (parent) {
      parent.removeChild(el!);
    }
  }
  function patch(
    oldVNode: null | VNode,
    newVNode: VNode,
    container: Element,
    anchor?: Node | null
  ) {
    // 类型不同时，直接删除旧节点
    if (oldVNode && oldVNode.type !== newVNode.type) {
      unmount(oldVNode);
      oldVNode = null;
    }
    const { type } = newVNode;
    // 字符串类型时 则是普通标签
    if (typeof type === "string") {
      if (!oldVNode) {
        mountElement(newVNode, container, anchor);
      } else {
        // 更新
        patchElement(oldVNode, newVNode);
      }
    } else if (type === Text) {
      if (!oldVNode) {
        const el = (newVNode.el = createText(newVNode.children as string));
        insert(el, container);
      } else {
        const el = (newVNode.el = oldVNode.el);
        if (newVNode.children !== oldVNode.children) {
          setText(el, newVNode.children as string);
        }
      }
    } else if (type === Fragment) {
      if (!oldVNode) {
        (newVNode.children as VNode[]).forEach((c) =>
          patch(null, c, container)
        );
      } else {
        patchChildren(oldVNode, newVNode, container);
      }
    } else if (typeof type === "object") {
      // 组件
    }
  }

  function patchElement(oldVNode: VNode, newVNode: VNode) {
    const el = (newVNode.el = oldVNode.el);

    const oldProps = oldVNode.props;
    const newProps = newVNode.props;
    // 更新props
    for (const key in newProps) {
      if (newProps[key] !== oldProps[key]) {
        patchProps(el!, key, oldProps[key], newProps[key]);
      }
    }
    // 移除
    for (const key in oldProps) {
      if (!(key in newProps)) {
        patchProps(el!, key, oldProps[key], null);
      }
    }
    // 更新child
    patchChildren(oldVNode, newVNode, el!);
  }

  function patchChildren(oldVNode: VNode, newVNode: VNode, el: Element) {
    if (typeof newVNode.children === "string") {
      // 卸载旧节点
      if (Array.isArray(oldVNode.children)) {
        oldVNode.children.forEach((c) => unmount(c));
      }
      setElementText(el, newVNode.children);
      return;
    }

    if (Array.isArray(newVNode.children)) {
      if (Array.isArray(oldVNode.children)) {
        // diff算法
        easyDiff(oldVNode, newVNode, el);
      } else {
        setElementText(el, "");
        newVNode.children.forEach((c) => patch(null, c, el));
      }
    }

    if (Array.isArray(oldVNode.children)) {
      oldVNode.children.forEach((c) => unmount(c));
    } else if (typeof oldVNode.children === "string") {
      setElementText(el, "");
    }
  }

  function mountElement(
    vnode: VNode,
    container: Element,
    anchor?: Node | null
  ) {
    const el = createElement(vnode.type);

    // 将真实DOM 绑在vnode上，方便后续移除
    vnode.el = el;

    if (typeof vnode.children === "string") {
      setElementText(el, vnode.children);
    } else if (Array.isArray(vnode.children)) {
      vnode.children.forEach((child) => {
        patch(null, child, el);
      });
    }

    if (vnode.props) {
      for (const key in vnode.props) {
        patchProps(el, key, null, vnode.props[key]);
      }
    }

    insert(el, container, anchor);
  }

  function easyDiff(oldVNode: VNode, newVNode: VNode, container: Element) {
    const oldChildren = oldVNode.children as VNode[];
    const newChildren = newVNode.children as VNode[];

    const oldLen = oldChildren.length;
    const newLen = newChildren.length;
    // const commonLen = Math.min(oldLen, newLen);

    //
    let lastIdx = 0;
    for (let i = 0; i < newChildren.length; i++) {
      const newVNode = newChildren[i];
      const idx = oldChildren.findIndex((c) => c.key === newVNode.key);
      let find = false;
      if (idx !== -1) {
        find = true;
        const oldVNode = oldChildren[idx];
        patch(oldVNode, newVNode, container);
        // 找到的索引比之前的索引要小，则需要移动当前
        if (idx < lastIdx) {
          // 前一个节点
          const prevNode = newChildren[i - 1];
          if (prevNode) {
            const anchor = prevNode.el?.nextSibling;
            // 插入到前一个节点的真实DOM之后
            insert(newVNode.el, container, anchor);
          }
        } else {
          lastIdx = idx;
        }
      }
      //   没有找到复用节点，则是新节点
      if (!find) {
        // 找到前一个节点，作为插入猫店
        const prevNode = newChildren[i - 1];
        let anchor = null;
        if (prevNode) {
          anchor = prevNode.el?.nextSibling;
        } else {
          anchor = container.firstChild;
        }
        patch(null, newVNode, container, anchor);
      }
    }

    for (let i = 0; i < oldChildren.length; i++) {
      const oldVNode = oldChildren[i];
      const has = newChildren.find((v) => v.key === oldVNode.key);
      // 未包含的，则说明是新节点中不存在，直接删除
      if (!has) {
        unmount(oldVNode);
      }
    }

    // for (let i = 0; i < commonLen; i++) {
    //   patch(oldChildren[i], newChildren[i], container);
    // }
    // // 新的比旧的多，则挂在剩余的，反之则卸载
    // if (newLen > oldLen) {
    //   for (let i = commonLen; i < newLen; i++) {
    //     patch(null, newChildren[i], container);
    //   }
    // } else if (oldLen > newLen) {
    //   for (let i = commonLen; i < oldLen; i++) {
    //     unmount(oldChildren[i]);
    //   }
    // }
  }

  function doublePointerDiff(
    oldVNode: VNode,
    newVNode: VNode,
    container: Element
  ) {
    const oldChildren = oldVNode.children as VNode[];
    const newChildren = newVNode.children as VNode[];

    let oldStartIdx = 0;
    let oldEndIdx = oldChildren.length - 1;
    let newStartIdx = 0;
    let newEndIdx = newChildren.length - 1;

    let oldStartVNode = oldChildren[oldStartIdx];
    let oldEndVNode = oldChildren[oldEndIdx];
    let newStartVNode = oldChildren[newStartIdx];
    let newEndVNode = oldChildren[newEndIdx];

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (oldStartVNode.key === newStartVNode.key) {
        // 新旧第一个相同
        patch(oldStartVNode, newStartVNode, container);

        oldStartVNode = oldChildren[++oldStartIdx];
        newStartVNode = newChildren[++newStartIdx];
      } else if (oldEndVNode.key === newEndVNode.key) {
        // 旧最后一个等于新最后一个
        patch(oldEndVNode, newEndVNode, container);
        oldEndVNode = oldChildren[--oldEndIdx];
        newEndVNode = newChildren[--newEndIdx];
      } else if (oldStartVNode.key === newEndVNode.key) {
        // 新最后一个 等于旧 第一个
        patch(oldStartVNode, newEndVNode, container);
        // 将 旧第一个DOM 插入到 旧最后一个 后
        insert(oldStartVNode.el, container, oldEndVNode.el?.nextSibling);
        oldStartVNode = oldChildren[++oldStartIdx];
        newEndVNode = newChildren[--newEndIdx];
      } else if (oldEndVNode.key === newStartVNode.key) {
        // 新第一个 和旧最后一个相同
        patch(oldEndVNode, newStartVNode, container);
        // 将最后一个el 插入到 第一个el 前
        insert(oldEndVNode.el, container, oldStartVNode.el);
        // 移动索引
        oldEndVNode = oldChildren[--oldEndIdx];
        newStartVNode = newChildren[++newStartIdx];
      } else {
        // 都不命中的情况
        const idxInOld = oldChildren.findIndex(
          (n) => n.key === newStartVNode.key
        );
        if (idxInOld > 0) {
          const vnodeToMove = oldChildren[idxInOld];
          patch(vnodeToMove, newStartVNode, container);
          insert(vnodeToMove.el, container, oldStartVNode.el);
          // @ts-ignore
          oldChildren[idxInOld] = null;
        } else {
          // 没有与第一个新的复用的旧节点，将新第一个插入到旧第一个前
          patch(null, newStartVNode, container, oldStartVNode.el);
        }
        newStartVNode = newChildren[++newStartIdx];
      }
    }

    // 这种情况，旧的遍历完了，新的还有遗留
    if (oldEndIdx < oldStartIdx && newStartIdx <= newEndIdx) {
      // 遗留的vnode 全部插入到 旧children 的头部节点
      for (let i = newStartIdx; i <= newEndIdx; i++) {
        patch(null, newChildren[i], container, oldStartVNode.el);
      }
    } else if (newEndIdx < newStartIdx && oldStartIdx <= oldEndIdx) {
      // 还有未删除的旧节点
      for (let i = oldStartIdx; i <= oldEndIdx; i++) {
        unmount(oldChildren[i]);
      }
    }
  }

  function quickDiff(n1: VNode, n2: VNode, container: Element) {
    const newChildren = n2.children as VNode[];
    const oldChildren = n1.children as VNode[];

    let j = 0;
    let oldVNode = oldChildren[j];
    let newVNode = newChildren[j];
    while (oldVNode.key === newVNode.key) {
      patch(oldVNode, newVNode, container);
      j++;
      oldVNode = oldChildren[j];
      newVNode = newChildren[j];
    }

    let oldEnd = oldChildren.length - 1;
    let newEnd = newChildren.length - 1;

    oldVNode = oldChildren[oldEnd];
    newVNode = oldChildren[newEnd];

    while (oldVNode.key === newVNode.key) {
      patch(oldVNode, newVNode, container);
      oldEnd--;
      newEnd--;
      oldVNode = oldChildren[oldEnd];
      newVNode = newChildren[newEnd];
    }

    if (j > oldEnd && j <= newEnd) {
      const anchorIdx = newEnd + 1;
      const anchor =
        anchorIdx < newChildren.length ? newChildren[anchorIdx].el : null;
      while (j <= newEnd) {
        patch(null, newChildren[j++], container, anchor);
      }
    } else if (j > newEnd && j <= oldEnd) {
      while (j <= oldEnd) {
        unmount(oldChildren[j++]);
      }
    } else {
      const count = newEnd - j + 1;
      const source = new Array(count).fill(-1);

      const oldStart = j;
      const newStart = j;
      let pos = 0;
      let moved = false;
      let patched = 0;
      let keyIndex: Record<string, number> = {};
      for (let i = newStart; i < newEnd; i++) {
        keyIndex[newChildren[i].key] = i;
      }

      for (let i = oldStart; i <= oldEnd; i++) {
        const oldVNode = oldChildren[i];

        if (patched <= count) {
          const k = keyIndex[oldVNode.key];

          if (typeof k !== "undefined") {
            const newVNode = newChildren[k];
            patch(oldVNode, newVNode, container);
            patched++;
            source[k - newStart] = i;

            if (k < pos) {
              moved = true;
            } else {
              pos = k;
            }
          } else {
            unmount(oldVNode);
          }
        } else {
          unmount(oldVNode);
        }
      }

      if (moved) {
        const seq = getSequence(source)

        let s = source.length - 1;
        let i = count - 1;
        for (i; i >= 0; i--) {
          if (source[i] === -1) {
            // 新增
            const pos = i + newStart;
            const newVNode = newChildren[pos];
            const nextPos = pos + 1;
            const anchor =
              nextPos < newChildren.length ? newChildren[nextPos].el : null;
            patch(null, newVNode, container, anchor);
          } else if (i !== seq[s]) {
            // 移动
            const pos = i + newStart;
            const newVNode = newChildren[pos];
            const nextPos = pos + 1;
            const anchor =
              nextPos < newChildren.length ? newChildren[nextPos].el : null;
            patch(null, newVNode, container, anchor);

            insert(newVNode.el, container, anchor);
          } else {
            s--;
          }
        }
      }
    }
  }

  function hydrate() {}

  return {
    render,
    hydrate,
  };
}

function getSequence(arr: number[]): number[] {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
