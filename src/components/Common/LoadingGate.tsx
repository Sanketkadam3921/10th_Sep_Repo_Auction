import React, { useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

/**
 * LoadingGate wraps children and shows the spinner until `ready` is true.
 * Adds a short minimum display duration to avoid flash.
 */
interface LoadingGateProps {
  ready: boolean;
  minMs?: number;
  children: React.ReactNode;
}

const LoadingGate: React.FC<LoadingGateProps> = ({ ready, minMs = 400, children }) => {
  const [show, setShow] = useState(true);
  const [mountTs] = useState(() => Date.now());

  useEffect(() => {
    if (ready) {
      const elapsed = Date.now() - mountTs;
      const wait = Math.max(0, minMs - elapsed);
      const t = setTimeout(() => setShow(false), wait);
      return () => clearTimeout(t);
    }
  }, [ready, minMs, mountTs]);

  return (
    <>
      {show && <LoadingSpinner />}
      <div style={{ display: show ? 'none' : 'block' }}>{children}</div>
    </>
  );
};

export default LoadingGate;




