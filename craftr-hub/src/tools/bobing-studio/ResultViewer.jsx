import React from 'react';

export default function ResultViewer({
  baseImage,
  baseMime,
  generatedImage,
  busy,
  busyMessage,
  mode,
  onClear,
}) {
  const isBaseLoading = busy && /Preprocessing|Detecting/i.test(busyMessage);
  const isResultLoading = busy && !/Preprocessing|Detecting/i.test(busyMessage);

  const statusType = busy ? 'busy' : 'ready';
  const statusText = busy ? busyMessage : 'Ready';

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div>
          <strong>Production Preview</strong>
          <div className="hint" style={{ margin: '4px 0 0' }}>
            Original di kiri, hasil AI di kanan. Semua output 1:1 PNG.
          </div>
        </div>
        <div className="status">
          <span className={`dot${statusType === 'busy' ? ' busy' : ''}`} />
          <span>{statusText}</span>
        </div>
      </div>

      {/* Stage */}
      <section className="stage">
        {/* Original / Base viewer */}
        <div className="viewer">
          <div className="viewer-head">
            <span>Original / Base</span>
            <span>{baseImage ? (baseMime || 'image/jpeg').toUpperCase().replace('IMAGE/', '') : 'No image'}</span>
          </div>
          <div
            className={`canvas${isBaseLoading ? ' is-loading' : ''}`}
            data-loading={busyMessage || 'Processing image'}
          >
            {isBaseLoading && <span className="loading-spinner" aria-hidden="true" />}
            {baseImage ? (
              <img src={baseImage} alt="Base product" />
            ) : (
              <div className="empty">Upload foto produk fashion muslim sebagai base image.</div>
            )}
          </div>
        </div>

        {/* Generated Result viewer */}
        <div className="viewer">
          <div className="viewer-head">
            <span>{mode === 'catalog' ? 'Catalog Result' : 'Recolor Result'}</span>
            <div className="mini-actions">
              <button
                className="icon-btn"
                type="button"
                title="Clear result"
                disabled={!generatedImage || busy}
                onClick={onClear}
              >
                &times;
              </button>
            </div>
          </div>
          <div
            className={`canvas${isResultLoading ? ' is-loading' : ''}`}
            data-loading={busyMessage || 'Processing image'}
          >
            {isResultLoading && <span className="loading-spinner" aria-hidden="true" />}
            {generatedImage ? (
              <img src={generatedImage} alt="Generated result" />
            ) : (
              <div className="empty">Hasil katalog atau recolor akan muncul di sini.</div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
