import React, { useEffect, useState } from 'react';

interface SnowflakesProps {
  show: boolean;
  onComplete?: () => void;
}

const Snowflakes: React.FC<SnowflakesProps> = ({ show, onComplete }) => {
  const [flakes, setFlakes] = useState<number[]>([]);

  useEffect(() => {
    if (show) {
      // Generate celebratory snowflakes
      const newFlakes = Array.from({ length: 30 }, (_, i) => i);
      setFlakes(newFlakes);

      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setFlakes([]);
        if (onComplete) onComplete();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show || flakes.length === 0) return null;

  return (
    <div className="snow-container" aria-hidden="true">
      {flakes.map((i) => (
        <div
          key={i}
          className="snowflake text-xl"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 2 + 2}s`,
            animationDelay: `${Math.random() * 0.5}s`,
            fontSize: `${Math.random() * 10 + 10}px`
          }}
        >
          ❄
        </div>
      ))}
    </div>
  );
};

export default Snowflakes;
