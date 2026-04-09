import React, { useEffect, useRef } from 'react';
import './FrogBackground.css';

const availableFrogs = ['frog.png', 'frog2.jpg', 'frog3.jpg', 'frog4.jpg', 'frog5.jpg']

const FrogBackground = () => {
  const containerRef = useRef(null);
  const frogsRef = useRef([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const numFrogs = 20;
    const frogs = [];

    for (let i = 0; i < numFrogs; i++) {
      const frog = document.createElement('div');
      frog.className = 'frog';

      const size = Math.random() * 50 + 30;
      frog.style.width = `${size}px`;
      frog.style.height = `${size}px`;

      frog.style.left = `${Math.random() * 100}%`;
      frog.style.top = `${Math.random() * 100}%`;

      const duration = Math.random() * 6 + 3;
      frog.style.animationDuration = `${duration}s`;

      const delay = Math.random() * -20;
      frog.style.animationDelay = `${delay}s`;

      const image = availableFrogs[Math.random() * availableFrogs.length | 0];
      frog.style.backgroundImage = `url('/frogs/${image}')`;

      if (Math.random() > 0.5) {
        frog.style.transform = 'scaleX(-1)';
      }

      container.appendChild(frog);
      frogs.push(frog);
    }

    frogsRef.current = frogs;

    return () => {
      frogs.forEach(frog => frog.remove());
    };
  }, []);

  return (
    <div ref={containerRef} className="frog-background">
      <div className="frog-overlay"></div>
    </div>
  );
};

export default FrogBackground;
