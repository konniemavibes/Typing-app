"use client";

const rainbowBorderStyles = `
  @keyframes rotating-rainbow {
    0% {
      background-image: conic-gradient(
        from 0deg,
        #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000
      );
      background-position: 0% 0%;
    }
    100% {
      background-image: conic-gradient(
        from 360deg,
        #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000
      );
      background-position: 0% 0%;
    }
  }
  
  .rainbow-border {
    position: relative;
    border-radius: 12px;
    background: white;
  }
  
  .rainbow-border::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 12px;
    padding: 3px;
    background: conic-gradient(
      from 0deg,
      #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    animation: rotating-rainbow 4s linear infinite;
  }
  
  .rainbow-border-thin {
    position: relative;
    border-radius: 12px;
    background: white;
  }
  
  .rainbow-border-thin::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 12px;
    padding: 2px;
    background: conic-gradient(
      from 0deg,
      #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    animation: rotating-rainbow 4s linear infinite;
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
