import React from 'react';
import { createRoot } from 'react-dom/client';
import './bobing-tool.css';
import { legacyMarkup, legacyScript } from './legacy-content.js';

function BobingStudio() {
  const rootRef = React.useRef(null);

  React.useEffect(() => {
    if (!rootRef.current) return undefined;

    rootRef.current.innerHTML = legacyMarkup;

    const runLegacyApp = new Function(legacyScript);
    runLegacyApp();

    return () => {
      rootRef.current.innerHTML = '';
    };
  }, []);

  return <div ref={rootRef} className="bobing-legacy-root" />;
}

createRoot(document.getElementById('root')).render(<BobingStudio />);
