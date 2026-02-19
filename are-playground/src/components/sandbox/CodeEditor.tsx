import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
}

export function CodeEditor({ code, onChange }: CodeEditorProps) {
  return (
    <div className="h-[500px] rounded-lg overflow-hidden border border-white/5">
      <Editor
        height="100%"
        defaultLanguage="javascript"
        value={code}
        onChange={(val) => onChange(val || '')}
        theme="vs-dark"
        options={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace",
          minimap: { enabled: false },
          padding: { top: 12 },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          tabSize: 2,
          automaticLayout: true,
          renderLineHighlight: 'none',
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          scrollbar: {
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
          },
        }}
      />
    </div>
  );
}
