import { useRef } from "react";
import { highlightCode } from "../utils/highlight";

// Textarea with a syntax-highlighted <pre> stacked underneath it.
export default function CodeEditor({ value, onChange, height = 280 }) {
  const preRef = useRef(null);

  const syncScroll = (e) => {
    if (!preRef.current) return;
    preRef.current.scrollTop = e.target.scrollTop;
    preRef.current.scrollLeft = e.target.scrollLeft;
  };

  return (
    <div className="cl-editor-wrap" style={{ height }}>
      <pre ref={preRef} className="cl-editor-pre">
        <code>{highlightCode(value)}</code>
      </pre>
      <textarea
        className="cl-editor-textarea"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
      />
    </div>
  );
}
