import React, { useEffect, useRef } from 'react';

const Intersection = ({ gridIndex, index, row, col, value, handleMove }) => {
  const intersectionRef = useRef(null);

  useEffect(() => {
    const intersection = intersectionRef.current;
    if (!intersection) return;

    const x = 10 + col * 20; // Pourcentage
    const y = 10 + row * 20; // Pourcentage
    intersection.style.left = x + '%';
    intersection.style.top = y + '%';

    // Mise à jour des classes
    intersection.className = 'intersection';
    if (value !== 0) {
      intersection.classList.add('occupied', `player${value}`);
    }
  }, [value, row, col]);

  const handleClick = () => {
    handleMove(gridIndex, index, row, col);
  };

  return (
    <div
      ref={intersectionRef}
      className="intersection"
      onClick={handleClick}
      data-grid-index={gridIndex}
      data-index={index}
      data-row={row}
      data-col={col}
    />
  );
};

export default Intersection;