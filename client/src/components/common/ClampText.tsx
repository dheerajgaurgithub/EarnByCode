import React, { useMemo, useState } from 'react';

interface ClampTextProps {
  text: string;
  lines?: number;
  className?: string;
  title?: string;
  moreLabel?: string;
  lessLabel?: string;
}

const ClampText: React.FC<ClampTextProps> = ({
  text,
  lines = 2,
  className = '',
  title,
  moreLabel = 'Show more',
  lessLabel = 'Show less',
}) => {
  const [expanded, setExpanded] = useState(false);

  const clampStyle = useMemo<React.CSSProperties>(() => {
    if (expanded) return {};
    return {
      display: '-webkit-box',
      WebkitLineClamp: lines,
      WebkitBoxOrient: 'vertical' as any,
      overflow: 'hidden',
    };
  }, [expanded, lines]);

  // Only show toggle if the text is "likely" long. This is a heuristic.
  const shouldShowToggle = text && text.length > lines * 20; // ~20 chars per line heuristic

  return (
    <div className={className} title={title}>
      <div style={clampStyle}>{text}</div>
      {shouldShowToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs text-blue-700 hover:text-blue-800 underline"
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      )}
    </div>
  );
};

export default ClampText;
