import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import CodeEditor from "../components/CodeEditor";
import { useApp } from "../context/AppContext";
import { VALIDATORS } from "../data/validators";
import { highlightCode } from "../utils/highlight";
import { lessonBackPath, lessonNextPath } from "../utils/paths";

// Injected into JS-lesson previews so console output reaches the "Console Output" panel.
const consoleHook = (lessonId) => `
<script>
(function() {
  function send(type, args) {
    try {
      var msg = Array.prototype.slice.call(args).map(function(a) {
        if (typeof a === 'object') {
          try { return JSON.stringify(a); } catch(e) { return String(a); }
        }
        return String(a);
      }).join(' ');
      window.parent.postMessage({ type: 'CL_CONSOLE', level: type, msg: msg, lessonId: ${lessonId} }, '*');
    } catch(e) {}
  }
  var oldLog = console.log;
  console.log = function() { send('log', arguments); if (oldLog) oldLog.apply(console, arguments); };
  var oldWarn = console.warn;
  console.warn = function() { send('warn', arguments); if (oldWarn) oldWarn.apply(console, arguments); };
  var oldErr = console.error;
  console.error = function() { send('error', arguments); if (oldErr) oldErr.apply(console, arguments); };
  window.onerror = function(msg, url, line) {
    send('error', [msg + (line ? ' (line ' + line + ')' : '')]);
  };
})();
</` + `script>`;

const LEVEL_COLOR = { log: "text-green-400", warn: "text-yellow-400", error: "text-red-400" };

function Quiz({ lessonId, questions, testPassed }) {
  const { quizState, setQuizAnswer, passCodeQuiz } = useApp();
  const quiz = quizState[lessonId] || { selected: {}, submitted: false, passed: testPassed };
  const [message, setMessage] = useState("");

  if (quiz.passed) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-xl p-4 mt-4">
        <div className="font-semibold text-green-800">✅ Quiz passed!</div>
      </div>
    );
  }

  const submit = () => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (quiz.selected[i] === q.correct) correct++;
    });
    if (correct === questions.length) {
      setMessage("");
      passCodeQuiz(lessonId);
    } else {
      setMessage(`You got ${correct}/${questions.length} correct. Review your answers and try again.`);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl p-5 mt-4">
      <h3 className="font-bold mb-3">Test Your Knowledge</h3>
      {questions.map((q, qi) => (
        <div key={qi} className="mb-4">
          <div className="font-medium text-sm mb-2">{qi + 1}. {q.q}</div>
          {q.options.map((opt) => (
            <button
              key={opt}
              className={`block w-full text-left border ${quiz.selected[qi] === opt ? "border-black bg-gray-100" : "border-gray-200"} rounded-lg px-3 py-2 text-sm mb-1.5`}
              onClick={() => setQuizAnswer(lessonId, qi, opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      ))}
      <div>{message && <div className="text-red-600 text-sm mb-2">{message}</div>}</div>
      <button className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold mt-2" onClick={submit}>Submit Answers</button>
    </div>
  );
}

// HTML / CSS / JavaScript lessons: concept cards, live code editor with validator checklist, then a quiz.
export default function CodeLessonPage({ lesson }) {
  const lessonId = lesson.id;
  const app = useApp();
  const navigate = useNavigate();
  const { editorCode, setEditorCode, completeCodeTask } = app;

  const slot = lessonId <= 10 ? app.statuses[lessonId - 1] : lessonId <= 22 ? app.cssStatuses[lessonId - 11] : app.jsStatuses[lessonId - 23];
  const code = editorCode[lessonId] ?? lesson.practice.starterCode;
  const isJs = lessonId >= 23 && lessonId <= 28;

  const [results, setResults] = useState(null);
  const [consoleLines, setConsoleLines] = useState([]);
  const consoleBox = useRef(null);

  // Console messages posted from the sandboxed preview iframe.
  useEffect(() => {
    const onMessage = (event) => {
      const d = event.data;
      if (d && d.type === "CL_CONSOLE" && d.lessonId === lessonId) {
        setConsoleLines((lines) => [...lines, { level: d.level, msg: d.msg }]);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [lessonId]);

  useEffect(() => {
    if (consoleBox.current) consoleBox.current.scrollTop = consoleBox.current.scrollHeight;
  }, [consoleLines]);

  const runValidate = () => {
    const res = VALIDATORS[lesson.practice.validateFn](code);
    setResults(res);
    if (res.every((r) => r.ok)) completeCodeTask(lessonId);
  };

  const reset = () => {
    setEditorCode(lessonId, lesson.practice.starterCode);
    setResults(null);
  };

  return (
    <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
      <button className="text-sm text-gray-500 mb-3" onClick={() => navigate(lessonBackPath(lessonId))}>← Back to dashboard</button>
      <h1 className="text-2xl font-extrabold mb-1">Level {lessonId}</h1>
      <p className="text-gray-600 mb-6">{lesson.desc}</p>

      <h2 className="font-bold text-sm uppercase text-gray-500 mb-3">{lesson.tagsToLearn}</h2>
      {lesson.cards.map((c, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4 mb-3">
          <div className="text-xs font-bold text-red-600 mb-1">{c.tag}</div>
          <div className="font-semibold mb-1">{c.title}</div>
          <p className="text-sm text-gray-600 mb-2">{c.explanation}</p>
          <pre className="bg-gray-900 text-gray-100 text-xs rounded-lg p-3 overflow-x-auto mb-2"><code>{highlightCode(c.exampleCode)}</code></pre>
          {c.preview && <div className="border border-gray-100 rounded-lg p-3 bg-white" dangerouslySetInnerHTML={{ __html: c.preview }} />}
        </div>
      ))}

      <h2 className="font-bold text-lg mt-8 mb-2">Build It Yourself</h2>
      <p className="text-sm text-gray-600 mb-2">{lesson.practice.desc}</p>
      <ul className="list-disc list-inside mb-4">
        {lesson.practice.reqs.map((r) => (
          <li key={r} className="text-sm text-gray-700">{r}</li>
        ))}
      </ul>

      <div className="grid md:grid-cols-2 gap-4 mb-3">
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-1">CODE EDITOR</div>
          <CodeEditor value={code} onChange={(v) => setEditorCode(lessonId, v)} />
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-1">LIVE PREVIEW</div>
          <iframe
            title="Live preview"
            className="w-full border border-gray-200 rounded-lg bg-white"
            style={{ height: 280 }}
            sandbox="allow-scripts"
            srcDoc={isJs ? consoleHook(lessonId) + code : code}
          ></iframe>
          {isJs && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-1">
                <span>CONSOLE OUTPUT</span>
                <button className="text-xs text-gray-400 hover:text-black font-semibold" onClick={() => setConsoleLines([])}>Clear</button>
              </div>
              <div ref={consoleBox} className="bg-gray-900 text-green-400 font-mono text-xs rounded-lg p-2.5 min-h-[60px] max-h-[120px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {consoleLines.map((l, i) => (
                  <div key={i} className={LEVEL_COLOR[l.level] || LEVEL_COLOR.log}>&gt; {l.msg}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 mb-2">
        <button className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold" onClick={runValidate}>▶ Run Code</button>
        <button className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-semibold" onClick={reset}>↺ Reset</button>
      </div>
      <div className="mb-6">
        {results && (
          <div className="border border-gray-200 rounded-lg p-4 mt-2 bg-gray-50">
            {results.map((r) => (
              <div key={r.id} className={`text-sm ${r.ok ? "text-green-700" : "text-gray-500"} flex items-center gap-2`}>
                {r.ok ? "✅" : "⬜"} {r.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {slot.taskCompleted ? (
        <Quiz lessonId={lessonId} questions={lesson.quiz.questions} testPassed={slot.testPassed} />
      ) : (
        <div className="text-sm text-gray-500 italic mt-4">Complete the practice task above to unlock the quiz.</div>
      )}

      {slot.taskCompleted && slot.testPassed && (
        <button className="bg-red-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm mt-6" onClick={() => navigate(lessonNextPath(lessonId))}>
          Continue →
        </button>
      )}
    </div>
  );
}
