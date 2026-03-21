import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const SPACING = 30;
const TRANSITION_DURATION = 1.5; // seconds — slower = smoother

/** Quintic ease-in-out for ultra-smooth transitions */
function smoothstep(t: number): number {
  t = Math.max(0, Math.min(1, t));
  return t < 0.5
    ? 16 * t * t * t * t * t
    : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

interface CameraControllerProps {
  currentStep: number;
  onTransitionUpdate?: (isTransitioning: boolean, progress: number) => void;
}

/** Smooth camera transitions between pipeline steps with dynamic FOV */
export default function CameraController({ currentStep, onTransitionUpdate }: CameraControllerProps) {
  const { camera } = useThree();

  const fromPos = useRef(new THREE.Vector3(0, 0, 12));
  const toPos = useRef(new THREE.Vector3(0, 0, 12));
  const fromTarget = useRef(new THREE.Vector3(0, 0, 0));
  const toTarget = useRef(new THREE.Vector3(0, 0, 0));
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));

  const isTransitioning = useRef(false);
  const transitionTime = useRef(0);
  const prevStep = useRef(currentStep);

  const baseFOV = 45;
  const step6FOV = 55;
  const warpFOV = 60;

  /** Get camera Z distance and FOV for a given step */
  const getStepCamera = (step: number) => {
    if (step === 6) return { z: 20, y: 1, fov: step6FOV };
    return { z: 12, y: 0, fov: baseFOV };
  };

  // Initialize camera position
  useEffect(() => {
    const xPos = (currentStep - 1) * SPACING;
    const cam = getStepCamera(currentStep);
    camera.position.set(xPos, cam.y, cam.z);
    currentTarget.current.set(xPos, 0, 0);
    camera.lookAt(currentTarget.current);
    (camera as THREE.PerspectiveCamera).fov = cam.fov;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  }, []);

  // Trigger transition when step changes
  const startTransition = useCallback((newStep: number) => {
    const targetX = (newStep - 1) * SPACING;
    const cam = getStepCamera(newStep);

    fromPos.current.copy(camera.position);
    toPos.current.set(targetX, cam.y, cam.z);

    fromTarget.current.copy(currentTarget.current);
    toTarget.current.set(targetX, 0, 0);

    isTransitioning.current = true;
    transitionTime.current = 0;
    prevStep.current = newStep;
  }, [camera]);

  useEffect(() => {
    if (currentStep !== prevStep.current) {
      startTransition(currentStep);
    }
  }, [currentStep, startTransition]);

  useFrame((_, delta) => {
    if (isTransitioning.current) {
      transitionTime.current += delta;
      const rawT = Math.min(1, transitionTime.current / TRANSITION_DURATION);
      const t = smoothstep(rawT);

      // Lerp camera position
      camera.position.lerpVectors(fromPos.current, toPos.current, t);

      // Lerp lookAt target
      currentTarget.current.lerpVectors(fromTarget.current, toTarget.current, t);
      camera.lookAt(currentTarget.current);

      // Dynamic FOV — lerp between start/end FOV with midpoint warp
      const fromFOV = getStepCamera(prevStep.current).fov;
      const toFOV = getStepCamera(currentStep).fov;
      const lerpedFOV = fromFOV + (toFOV - fromFOV) * t;
      const fovT = Math.sin(rawT * Math.PI);
      (camera as THREE.PerspectiveCamera).fov = lerpedFOV + (warpFOV - lerpedFOV) * fovT * 0.3;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();

      // Report progress
      onTransitionUpdate?.(true, t);

      // Transition complete
      if (rawT >= 1) {
        isTransitioning.current = false;
        camera.position.copy(toPos.current);
        currentTarget.current.copy(toTarget.current);
        camera.lookAt(currentTarget.current);
        (camera as THREE.PerspectiveCamera).fov = getStepCamera(currentStep).fov;
        (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
        onTransitionUpdate?.(false, 1);
      }
    }
  });

  return null; // This component only controls the camera, no visual output
}
