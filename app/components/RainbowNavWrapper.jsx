"use client";

const rainbowBorderStyles = `
  @keyframes rainbow-border-spin {
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
  
  .rainbow-border {
    position: relative;
    background: white;
    border-radius: 12px;
  }
  
  .rainbow-border::before {
    content: '';
    position: absolute;
    inset: 0;
    padding: 2px;
    background: linear-gradient(90deg,
      #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000
    );
    background-size: 300% 300%;
    animation: rainbow-border-spin 3s linear infinite;
    border-radius: 12px;
    z-index: -1;
  }
  
  .rainbow-border-thin {
    position: relative;
    background: white;
    border-radius: 12px;
  }
  
  .rainbow-border-thin::before {
    content: '';
    position: absolute;
    inset: 0;
    padding: 1px;
    background: linear-gradient(90deg,
      #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000
    );
    background-size: 300% 300%;
    animation: rainbow-border-spin 3s linear infinite;
    border-radius: 12px;
    z-index: -1;
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
