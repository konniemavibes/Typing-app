"use client";

const rainbowBorderStyles = `
  @keyframes rainbow-rotate {
    0% { 
      background-position: 0% center;
      filter: brightness(1);
    }
    50% {
      filter: brightness(1.1);
    }
    100% { 
      background-position: 200% center;
      filter: brightness(1);
    }
  }
  
  .rainbow-border {
    position: relative;
    background: linear-gradient(90deg, 
      #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000
    );
    background-size: 200% auto;
    animation: rainbow-rotate 4s linear infinite;
    padding: 3px;
    border-radius: 0;
  }
  
  .rainbow-border-thin {
    position: relative;
    background: linear-gradient(90deg, 
      #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000
    );
    background-size: 200% auto;
    animation: rainbow-rotate 4s linear infinite;
    padding: 2px;
  }
`;

export function RainbowNavWrapper({ children, className = "" }) {
  return (
    <>
      <style>{rainbowBorderStyles}</style>
      <div className={`rainbow-border ${className}`}>
        {children}
      </div>
    </>
  );
}

export { rainbowBorderStyles };
