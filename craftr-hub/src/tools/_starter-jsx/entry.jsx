import React from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Card, Field, ToolShell, Toolbar, UploadZone } from '../../shared/ui.jsx';
import '../../shared/tool-template.css';

function StarterTool() {
  const [prompt, setPrompt] = React.useState('');
  const [fileName, setFileName] = React.useState('');

  return (
    <ToolShell title="Starter Tool" subtitle="Use this as the baseline for new JSX tools.">
      <Toolbar>
        <Button variant="primary">Primary Action</Button>
        <Button>Secondary Action</Button>
      </Toolbar>

      <Card>
        <Field label="Prompt" hint="Keep tool-specific prompt logic inside this tool folder.">
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={5} />
        </Field>
      </Card>

      <Card>
        <UploadZone
          label={fileName || 'Upload image'}
          hint="Files stay local unless the tool sends them through the Gemini helper."
          onFile={(file) => setFileName(file.name)}
        />
      </Card>
    </ToolShell>
  );
}

createRoot(document.getElementById('root')).render(<StarterTool />);
