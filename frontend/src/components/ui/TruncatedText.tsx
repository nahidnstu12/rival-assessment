"use client";

import { useEffect, useRef, useState } from "react";

type TruncatedTextProps = {
  text: string;
  lines?: 1 | 2;
  className?: string;
};

export function TruncatedText({ text, lines = 1, className }: TruncatedTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function check() {
      const node = ref.current;
      if (!node) return;
      if (lines === 1) {
        setOverflow(node.scrollWidth > node.clientWidth + 1);
      } else {
        setOverflow(node.scrollHeight > node.clientHeight + 1);
      }
    }

    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, lines]);

  return (
    <div ref={ref} className={className} title={overflow ? text : undefined}>
      {text}
    </div>
  );
}
