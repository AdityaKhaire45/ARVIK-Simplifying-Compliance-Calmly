import React, { useState, useEffect } from 'react';

const MouseGlow = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event) => {
      setMousePos({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: -1,
        background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(61, 191, 193, 0.15), transparent 80%)`,
        transition: 'background 0.1s ease-out'
      }}
    />
  );
};

export default MouseGlow;
