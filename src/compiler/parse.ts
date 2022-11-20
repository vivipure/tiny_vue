const State = {
  initial: 1, //初始状态
  tagOpen: 2, //标签开始状态
  tagName: 3, //标签名称状态
  text: 4, // 文本状态
  tagEnd: 5, //标签结束状态
  tagEndName: 6, //结束标签名称状态
};

function isAlpha(char: string) {
  return (char >= "a" && char <= "z") || (char >= "A" && char <= "Z");
}

export function tokenize(str: string) {
  let currentState = State.initial;

  const chars: string[] = [];
  const tokens = [];

  while (str) {
    const char = str[0];
    console.log(str, char, currentState);
    switch (currentState) {
      case State.initial:
        if (char === "<") {
          // 切换到标签开始状态
          currentState = State.tagOpen;
          str = str.slice(1);
        } else if (isAlpha(char)) {
          // 切换到文本状态
          currentState = State.text;
          chars.push(char);
          str = str.slice(1);
        }
        break;
      case State.tagOpen:
        if (isAlpha(char)) {
          // 标签名称状态
          currentState = State.tagName;
          chars.push(char);
          str = str.slice(1);
        } else if (char === "/") {
          // 标签结束状态 </
          currentState = State.tagEnd;
          str = str.slice(1);
        }
        break;
      case State.tagName:
        if (isAlpha(char)) {
          chars.push(char);
          str = str.slice(1);
        } else if (char === ">") {
          currentState = State.initial;
          tokens.push({
            type: "tag",
            name: chars.join(""),
          });
          chars.length = 0;
          str = str.slice(1);
        }
        break;

      case State.text:
        if (isAlpha(char)) {
          chars.push(char);
          str = str.slice(1);
        } else if (char === "<") {
          currentState = State.tagOpen;
          tokens.push({
            type: "text",
            content: chars.join(""),
          });
          chars.length = 0;
          str = str.slice(1);
        }
        break;

      case State.tagEnd:
        if (isAlpha(char)) {
          currentState = State.tagEndName;
          chars.push(char);
          str = str.slice(1);
        }

        break;
      case State.tagEndName:
        if (isAlpha(char)) {
          chars.push(char);
          str = str.slice(1);
        } else if (char === ">") {
          currentState = State.initial;
          tokens.push({
            type: "tagEnd",
            name: chars.join(""),
          });
          chars.length = 0;
          str = str.slice(1);
        }
        break;
    }
  }
  return tokens;
}

interface Node {
  type: String;
  children?: Node[];
  content?: string;
  tag?: string;
}

export function parse(str: string) {
  const tokens = tokenize(str);
  const root: Node = {
    type: "Root",
    children: [],
  };
  const elementStack = [root];
  while (tokens.length) {
    const parent = elementStack[elementStack.length - 1];
    const t = tokens[0];
    switch (t.type) {
      case "tag":
        const elementNode = {
          type: "Element",
          tag: t.name,
          children: [],
        };
        parent.children!.push(elementNode);
        elementStack.push(elementNode);
        break;

      case "text":
        const textNode = {
          type: "Text",
          content: t.content,
        };
        parent.children?.push(textNode);
        break;
      case "tagEnd":
        elementStack.pop();
        break;
    }
    tokens.shift();
  }
  return root;
}

export function dump(node: Node, indent = 0) {
  const type = node.type;

  const desc =
    node.type === "Root"
      ? ""
      : node.type === "Element"
      ? node.tag
      : node.content;

  console.log(`${"-".repeat(indent)}${type} ${desc}`);

  if (node.children) {
    node.children.forEach((n) => dump(n, indent + 2));
  }
}

export function traverseNode(
  ast: Node,
  context: {
    nodeTransforms: ((n: Node) => void)[];
  }
) {
  const currentNode = ast;
  const children = currentNode.children;

  const transforms = context.nodeTransforms;
  transforms.forEach((t) => {
    t(currentNode);
  });

  if (children) {
    children.forEach((n) => traverseNode(n, context));
  }
}

function transforms(ast: Node) {
  const context = {
    nodeTransforms: [
    ]
  }
  traverseNode(ast, context)
  console.log(dump(ast))
}