import React from 'react';

export default function HistoryStrip({ history, generatedImage, onSelect }) {
  if (history.length === 0) return null;

  return (
    <section className="history">
      {history.map((item, index) => (
        <button
          key={index}
          className={`history-item${item.image === generatedImage ? ' active' : ''}`}
          type="button"
          title={item.label}
          onClick={() => onSelect(item)}
        >
          <img src={item.image} alt={item.label} />
        </button>
      ))}
    </section>
  );
}
