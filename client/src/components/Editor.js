import React, { useEffect, useRef } from "react";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/clike/clike";
import "codemirror/mode/python/python";
import "codemirror/theme/dracula.css";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import "codemirror/lib/codemirror.css";
import CodeMirror from "codemirror";
import { ACTIONS } from "../Actions";

function Editor({ socketRef, roomId, onCodeChange, language, defaultCode }) {
  const editorRef = useRef(null);
  const codeMirrorInstance = useRef(null);

  // Helper to get CodeMirror mode by language
  const getMode = (lang) => {
    switch (lang) {
      case "java":
        return "text/x-java";
      case "python3":
        return "python";
      default:
        return "javascript";
    }
  };

  // Initialize CodeMirror only once
  useEffect(() => {
    const init = async () => {
      const editor = CodeMirror.fromTextArea(
        document.getElementById("realtimeEditor"),
        {
          mode: getMode(language),
          theme: "dracula",
          autoCloseTags: true,
          autoCloseBrackets: true,
          lineNumbers: true,
        }
      );
      editorRef.current = editor;
      codeMirrorInstance.current = editor;
      editor.setSize(null, "100%");
      editor.setValue(defaultCode);
      onCodeChange(defaultCode);
      editor.on("change", (instance, changes) => {
        const { origin } = changes;
        const code = instance.getValue();
        onCodeChange(code);
        if (origin !== "setValue") {
          socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code,
          });
        }
      });
    };
    init();
    // eslint-disable-next-line
  }, []);

  // Update mode and default code when language changes
  useEffect(() => {
    if (codeMirrorInstance.current) {
      codeMirrorInstance.current.setOption("mode", getMode(language));
      codeMirrorInstance.current.setValue(defaultCode);
      onCodeChange(defaultCode);
    }
    // eslint-disable-next-line
  }, [language, defaultCode]);

  // data receive from server
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        if (code !== null && codeMirrorInstance.current) {
          codeMirrorInstance.current.setValue(code);
        }
      });
    }
    return () => {
      socketRef.current.off(ACTIONS.CODE_CHANGE);
    };
  }, [socketRef.current]);

  return (
    <div style={{ height: "600px" }}>
      <textarea id="realtimeEditor"></textarea>
    </div>
  );
}

export default Editor;
