import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { HIGHWAY_CURVE } from '../curveConfig';
import { useProgress } from '../ProgressContext';

/**
 * CameraRig — Follows the pulse along the Data Highway curve.
 * Reads pulse progress from shared ProgressContext (no scene.traverse).
 * Programmatically scrolls the HTML container AND dispatches a scroll event
 * so drei's useScroll hook detects the change.
 */


export default function CameraRig() {
  const { camera } = useThree();
  const scroll = useScroll();
  const { progressRef } = useProgress();

  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const cameraT = useRef(0);
  const scrollSmooth = useRef(0);
  const userScrolledAhead = useRef(false);
  const lastManualScroll = useRef(0);

  useFrame((_state, delta) => {
    const pulseProgress = progressRef.current;

    // Step-driven target: use progressRef written by DataHighway (uniform param 0→1)
    const stepT = progressRef.current;

    const scrollT = scroll.offset;

    // Detect if user has manually scrolled ahead of the step progress
    if (scrollT > stepT + 0.05) {
      userScrolledAhead.current = true;
      lastManualScroll.current = Date.now();
    }
    // Reset after 2 seconds of no manual override or when steps catch up
    if (stepT >= scrollT - 0.02 && Date.now() - lastManualScroll.current > 2000) {
      userScrolledAhead.current = false;
    }

    const targetProgress = Math.max(pulseProgress, scrollT);

    // Camera follows with slow cinematic lag
    const lagSpeed = 0.8 * delta;
    cameraT.current += (targetProgress - cameraT.current) * lagSpeed;
    const t = Math.max(0, Math.min(cameraT.current, 0.999));

    // Camera position — use getPoint (uniform param) to match socket/pulse positions
    const curvePoint = HIGHWAY_CURVE.getPoint(t);
    targetPos.set(curvePoint.x, curvePoint.y + 4, curvePoint.z + 10);
    camera.position.lerp(targetPos, 0.04);

    // Look ahead
    const lookT = Math.min(t + 0.04, 1.0);
    HIGHWAY_CURVE.getPoint(lookT, lookTarget);
    camera.lookAt(lookTarget);

    camera.near = 0.5;
    camera.far = 120;
    camera.updateProjectionMatrix();

    // Programmatic scroll: only when steps are leading AND user hasn't scrolled ahead
    if (stepT > scrollT + 0.01 && !userScrolledAhead.current) {
      scrollSmooth.current += (stepT - scrollSmooth.current) * Math.min(delta * 1.2, 0.05);
      const el = scroll.el;
      if (el) {
        const maxScroll = el.scrollHeight - el.clientHeight;
        const newScrollTop = scrollSmooth.current * maxScroll;
        el.scrollTop = newScrollTop;
        // Dispatch a native scroll event so drei detects the change
        el.dispatchEvent(new Event('scroll', { bubbles: true }));
      }
    }
  });

  return null;
}
