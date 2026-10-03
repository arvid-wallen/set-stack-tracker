import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import type { Mesh } from 'three';

function Blob({ tilt }: { tilt: React.MutableRefObject<{ x: number; y: number }> }) {
  const ref = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const d = Math.min(dt, 0.05);
    ref.current.rotation.y += d * 0.12;
    ref.current.rotation.x += (tilt.current.x - ref.current.rotation.x) * (1 - Math.exp(-2 * d));
    ref.current.rotation.z += (tilt.current.y - ref.current.rotation.z) * (1 - Math.exp(-2 * d));
  });
  return (
    <Float speed={0.9} rotationIntensity={0.2} floatIntensity={0.6}>
      <mesh ref={ref} scale={1.3}>
        <icosahedronGeometry args={[1, 20]} />
        <MeshDistortMaterial color="#aafcae" roughness={0.9} metalness={0} distort={0.25} speed={0.8} />
      </mesh>
    </Float>
  );
}

export default function Hero3D() {
  const tilt = useRef({ x: 0, y: 0 });
  const [visible, setVisible] = useState(!document.hidden);

  useEffect(() => {
    const onVis = () => setVisible(!document.hidden);
    const onTilt = (e: DeviceOrientationEvent) => {
      tilt.current.x = ((e.beta ?? 0) - 45) / 240;
      tilt.current.y = (e.gamma ?? 0) / 240;
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('deviceorientation', onTilt);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('deviceorientation', onTilt);
    };
  }, []);

  return (
    <Canvas
      frameloop={visible ? 'always' : 'never'}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 4.2], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
    >
      <ambientLight intensity={1.3} />
      <directionalLight position={[2, 4, 5]} intensity={0.6} />
      <Blob tilt={tilt} />
    </Canvas>
  );
}
