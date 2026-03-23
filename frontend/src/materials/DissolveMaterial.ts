import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * DissolveMaterial — Custom GLSL shader for the "solid → wireframe" transition.
 * Driven by uProgress (0 = fully solid, 1 = fully dissolved).
 * Creates a glowing neon edge at the dissolve boundary.
 */
const DissolveMaterial = shaderMaterial(
  {
    uProgress: 0,
    uColor: new THREE.Color('#1a1a24'),
    uEdgeColor: new THREE.Color('#00ffcc'),
    uThickness: 0.15,
    uAxis: new THREE.Vector3(0, 0, 1),
  },
  // VERTEX SHADER
  `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  // FRAGMENT SHADER
  `
    uniform float uProgress;
    uniform vec3 uColor;
    uniform vec3 uEdgeColor;
    uniform float uThickness;
    uniform vec3 uAxis;
    varying vec3 vWorldPosition;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main() {
      float currentPos = dot(vWorldPosition, uAxis) * 0.15;
      float wipeThreshold = mix(-2.5, 2.5, uProgress);
      float noise = random(vWorldPosition.xy * 10.0) * 0.12;

      if (currentPos < wipeThreshold - noise) {
        discard;
      }

      float edgeDist = currentPos - (wipeThreshold - noise);

      if (edgeDist < uThickness) {
        float edgeGlow = 1.0 - (edgeDist / uThickness);
        vec3 glow = uEdgeColor * (1.0 + edgeGlow * 2.0);
        gl_FragColor = vec4(glow, 1.0);
      } else {
        gl_FragColor = vec4(uColor, 1.0);
      }
    }
  `
);

extend({ DissolveMaterial });

declare module '@react-three/fiber' {
  interface IntrinsicElements {
    dissolveMaterial: any;
  }
}

export default DissolveMaterial;
