export const VOID_TAGS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);

export function checkSyntaxError(code) {
  if (!code) return null;
  const stack = [];
  const tagRe = /<\/?([a-zA-Z][\w:-]*)[^>]*?(\/?)>/g;
  let m;
  while ((m = tagRe.exec(code))) {
    const full = m[0];
    const name = m[1].toLowerCase();
    const selfClose = m[2] === "/" || VOID_TAGS.has(name);
    if (full[1] === "/") {
      const idx = stack.lastIndexOf(name);
      if (idx === -1) return `Unexpected closing tag </${name}>`;
      stack.length = idx;
    } else if (!selfClose) {
      stack.push(name);
    }
  }
  if (stack.length) return `Unclosed tag: <${stack[stack.length - 1]}>`;
  return null;
}

export function hasTagFn(code, tag) {
  if (!code) return false;
  return new RegExp(`<${tag}[\\s>]`, "i").test(code) || new RegExp(`<${tag}>`, "i").test(code);
}
