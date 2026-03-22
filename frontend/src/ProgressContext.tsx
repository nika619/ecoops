import { createContext, useContext, useRef, type MutableRefObject } from 'react';

/**
 * Shared progress ref to avoid scene.traverse() on every frame.
 * DataHighway writes to this ref, CameraRig reads from it.
 */
interface ProgressContextType {
  progressRef: MutableRefObject<number>;
}

const ProgressContext = createContext<ProgressContextType>({
  progressRef: { current: 0 },
});

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const progressRef = useRef(0);
  return (
    <ProgressContext.Provider value={{ progressRef }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  return useContext(ProgressContext);
}
