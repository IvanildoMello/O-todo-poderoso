import React, { useEffect, useRef } from 'react';

interface MathDisplayProps {
  content: string;
}

declare global {
  interface Window {
    katex: any;
  }
}

const MathDisplay: React.FC<MathDisplayProps> = ({ content }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && window.katex) {
      // Basic splitting for LaTeX rendering (simplified)
      // This is a basic implementation. For production, consider a robust parser.
      const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
      
      containerRef.current.innerHTML = '';
      
      parts.forEach(part => {
        const span = document.createElement('span');
        if (part.startsWith('$$') && part.endsWith('$$')) {
          try {
            window.katex.render(part.slice(2, -2), span, { displayMode: true, throwOnError: false });
          } catch (e) { span.innerText = part; }
        } else if (part.startsWith('$') && part.endsWith('$')) {
           try {
            window.katex.render(part.slice(1, -1), span, { displayMode: false, throwOnError: false });
          } catch (e) { span.innerText = part; }
        } else {
          // Handle newlines for text parts
          span.innerHTML = part.replace(/\n/g, '<br/>');
        }
        containerRef.current?.appendChild(span);
      });
    } else if (containerRef.current) {
        containerRef.current.innerText = content;
    }
  }, [content]);

  return <div ref={containerRef} className="text-gray-200 leading-relaxed font-mono text-sm" />;
};

export default MathDisplay;