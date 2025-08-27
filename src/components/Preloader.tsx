import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface PreloaderProps {
  onComplete: () => void;
}

const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const greetingsRef = useRef<HTMLDivElement>(null);

  const greetings = ['Hello', 'Welcome', 'Ready to Chat?'];

  useEffect(() => {
    const tl = gsap.timeline();

    // Initial setup
    gsap.set(containerRef.current, { opacity: 1 });
    gsap.set(progressBarRef.current, { width: '0%' });
    gsap.set('.greeting', { opacity: 0, y: 20 });

    // Animate greetings sequence
    greetings.forEach((_, index) => {
      tl.to(`.greeting-${index}`, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out'
      })
      .to(`.greeting-${index}`, {
        opacity: 0,
        y: -20,
        duration: 0.4,
        delay: 0.8,
        ease: 'power2.in'
      });
    });

    // Progress bar animation
    tl.to(progressBarRef.current, {
      width: '100%',
      duration: 1.5,
      ease: 'power2.inOut'
    }, '-=0.5');

    // Final fade out
    tl.to(containerRef.current, {
      opacity: 0,
      duration: 0.5,
      onComplete: onComplete
    });

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="preloader"
    >
      <div className="preloader-content">
        <div ref={greetingsRef} className="greetings-container">
          {greetings.map((greeting, index) => (
            <div
              key={index}
              className={`greeting greeting-${index}`}
            >
              {greeting}
            </div>
          ))}
        </div>
        
        <div className="progress-container">
          <div className="progress-track">
            <div
              ref={progressBarRef}
              className="progress-bar"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preloader;