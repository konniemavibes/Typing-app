"use client";

const rainbowBorderStyles = `
  @keyframes gradient-border-rotate {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
  
  .gradient-glow-wrapper {
    position: relative;
    width: fit-content;
  }
  
  .gradient-border-inner {
    position: relative;
    z-index: 2;
    padding: 2px;
    background: linear-gradient(
      90deg,
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
    background-size: 300% 300%;
    animation: gradient-border-rotate 4s ease infinite;
    border-radius: 9999px;
  }
  
  .gradient-glow-wrapper.light .gradient-border-inner {
    background: linear-gradient(
      90deg,
      #FFD700,
      #FFA500,
      #FF6347,
      #FF69B4,
      #9370DB,
      #4169E1,
      #1E90FF,
      #FFD700
    );
    background-size: 300% 300%;
    animation: gradient-border-rotate 4s ease infinite;
  }
`;

export function RainbowNavWrapper({ children, className = "", isDark = false }) {
  return (
    <>
      <style>{rainbowBorderStyles}</style>
      <div className={className}>
        <div className={`gradient-glow-wrapper ${!isDark ? 'light' : ''}`}>
          <div className="gradient-border-inner">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

export { rainbowBorderStyles };
