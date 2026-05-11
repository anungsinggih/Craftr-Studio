import React from 'react';

const cx = (...classes) => classes.filter(Boolean).join(' ');

export function ToolShell({ title, subtitle, aside, children }) {
  return (
    <main className="craftr-tool-shell">
      <section className="craftr-tool-main">
        <header className="craftr-tool-header">
          <div>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {aside ? <div className="craftr-tool-header-aside">{aside}</div> : null}
        </header>
        {children}
      </section>
    </main>
  );
}

export function Card({ children, className = '' }) {
  return <section className={cx('craftr-card', className)}>{children}</section>;
}

export function Toolbar({ children, className = '' }) {
  return <div className={cx('craftr-toolbar', className)}>{children}</div>;
}

export function Button({ children, variant = 'secondary', className = '', ...props }) {
  return (
    <button className={cx('craftr-button', `craftr-button-${variant}`, className)} type="button" {...props}>
      {children}
    </button>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="craftr-field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

export function UploadZone({ label = 'Upload file', hint, accept = 'image/*', onFile }) {
  const inputRef = React.useRef(null);

  const handleFiles = (files) => {
    const file = files?.[0];
    if (file && onFile) onFile(file);
  };

  return (
    <div
      className="craftr-upload-zone"
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        handleFiles(event.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(event) => handleFiles(event.target.files)}
      />
      <strong>{label}</strong>
      {hint ? <span>{hint}</span> : null}
    </div>
  );
}
