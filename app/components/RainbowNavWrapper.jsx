"use client";

const rainbowBorderStyles = `
  @keyframes rainbow-rotate {
    0% {
      background-position: 0% center;
    }
    100% {
      background-position: 200% center;
    }
  }
  
  .rainbow-border {
    position: relative;
  }
  
  .rainbow-border::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg,
      #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000
    );
    background-size: 200% 100%;
    animation: rainbow-rotate 3s linear infinite;
    border-radius: 0 0 16px 16px;
  }
  
  .rainbow-border-thin {
    position: relative;
  }
  
  .rainbow-border-thin::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg,
      #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000
    );
    background-size: 200% 100%;
    animation: rainbow-rotate 3s linear infinite;
    border-radius: 0 0 16px 16px;
  }
`;

export function RainbowNavWrapper({ children, className = "" }) {
  return (
    <>
      <style>{rainbowBorderStyles}</style>
      <div className={`rainbow-border ${className}`} style={{borderRadius: '0 0 24px 24px'}}>
        {children}
      </div>
    </>
  );
}

export { rainbowBorderStyles };
