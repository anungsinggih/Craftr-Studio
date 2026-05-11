import React from 'react';

export default function CompareSlider({
  baseImage,
  generatedImage,
  comparePosition,
  setComparePosition,
}) {
  if (!baseImage || !generatedImage) return null;

  return (
    <section className="compare-panel">
      <div className="viewer-head">
        <span>Before / After Compare</span>
        <span>{comparePosition}%</span>
      </div>
      <div className="compare-wrap">
        <img src={baseImage} alt="Before" />
        <img
          src={generatedImage}
          alt="After"
          className="compare-after"
          style={{ clipPath: `inset(0 ${100 - comparePosition}% 0 0)` }}
        />
      </div>
      <input
        className="compare-range"
        type="range"
        min="0"
        max="100"
        value={comparePosition}
        onChange={(e) => setComparePosition(Number(e.target.value))}
      />
    </section>
  );
}
