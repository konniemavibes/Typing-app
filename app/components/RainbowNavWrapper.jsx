"use client";

const rainbowBorderStyles = `
  .gradient-glow-wrapper {
    position: relative;
    width: fit-content;
  }
  
  .gradient-border-inner {
    position: relative;
    z-index: 2;
    padding: 2px;
    background: conic-gradient(
      from 0deg,
      #00ffff,
      #0077ff,
      #7700ff,
      #ff0077,
      #ff0000,
      #ff7700,
      #ffff00,
      #00ff00,
      #00ffff
    );
    border-radius: 9999px;
  }
`;

export function RainbowNavWrapper({ children, className = "" }) {
  return (
    <>
      <style>{rainbowBorderStyles}</style>
      <div className={`gradient-glow-wrapper ${className}`}>
        <div className="gradient-border-inner">
          {children}
        </div>
      </div>
    </>
  );
}

export { rainbowBorderStyles };
