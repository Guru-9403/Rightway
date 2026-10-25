import { Fragment } from "react";

// Syntax highlighter for the lesson editor. Returns React nodes (React escapes text, so no escapeHtml needed).

function highlightTag(tag, key) {
  const nodes = [];
  const openMatch = tag.match(/^<\/?/);
  const open = openMatch ? openMatch[0] : "<";
  nodes.push(<span key="o" className="tok-punct">{open}</span>);
  let rest = tag.slice(open.length);
  const endMatch = rest.match(/\/?>$/);
  const endStr = endMatch ? endMatch[0] : "";
  rest = endStr ? rest.slice(0, rest.length - endStr.length) : rest;

  const nameMatch = rest.match(/^[a-zA-Z][\w:-]*/);
  if (nameMatch) {
    nodes.push(<span key="n" className="tok-tag">{nameMatch[0]}</span>);
    rest = rest.slice(nameMatch[0].length);
  }

  const attrRe = /(\s+)([a-zA-Z_:][\w:-]*)(\s*=\s*)?("[^"]*"|'[^']*'|[^\s"'>]+)?/g;
  let last = 0;
  let am;
  let i = 0;
  while ((am = attrRe.exec(rest))) {
    nodes.push(am[1] || "");
    nodes.push(<span key={`a${i}`} className="tok-attr">{am[2]}</span>);
    if (am[3] !== undefined) {
      nodes.push(am[3]);
      if (am[4] !== undefined) nodes.push(<span key={`s${i}`} className="tok-string">{am[4]}</span>);
    }
    last = attrRe.lastIndex;
    if (am[0].length === 0) attrRe.lastIndex++;
    i++;
  }
  nodes.push(rest.slice(last));
  nodes.push(<span key="e" className="tok-punct">{endStr}</span>);
  return <Fragment key={key}>{nodes}</Fragment>;
}

const TOKEN_RE = /(<!--[\s\S]*?-->)|(<!DOCTYPE[^>]*>)|(<\/?[a-zA-Z][\w:-]*(?:\s+[^<>]*)?\/?>)|([^<]+)|(<)/gi;

export function highlightCode(code) {
  if (!code) return null;
  const out = [];
  const re = new RegExp(TOKEN_RE.source, TOKEN_RE.flags);
  let m;
  let k = 0;
  while ((m = re.exec(code))) {
    if (m[1] !== undefined) out.push(<span key={k} className="tok-comment">{m[1]}</span>);
    else if (m[2] !== undefined) out.push(<span key={k} className="tok-doctype">{m[2]}</span>);
    else if (m[3] !== undefined) out.push(highlightTag(m[3], k));
    else if (m[4] !== undefined) out.push(m[4]);
    else if (m[5] !== undefined) out.push(m[5]);
    k++;
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  return out;
}
