import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import type { Mesh } from 'three';

function Blob({ tilt }: { tilt: React.MutableRefObject<{ x: number; y: number }> }) {
  const ref = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.25;
    ref.current.rotation.x += (tilt.current.x - ref.current.rotation.x) * 0.05;
    ref.current.rotation.z += (tilt.current.y - ref.current.rotation.z) * 0.05;
  });
  return (
    <Float speed={1.6} rotationIntensity={0.4} floatIntensity={1.1}>
      <mesh ref={ref} scale={1.35}>
        <icosahedronGeometry args={[1, 24]} />
        <MeshDistortMaterial color="#aafcae" roughness={0.15} metalness={0.25} distort={0.38} speed={1.6} />
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
      tilt.current.x = ((e.beta ?? 0) - 45) / 180;
      tilt.current.y = (e.gamma ?? 0) / 180;
    };
    const onMove = (e: PointerEvent) => {
      tilt.current.x = (e.clientY / window.innerHeight - 0.5) * 0.6;
      tilt.current.y = (e.clientX / window.innerWidth - 0.5) * 0.6;
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('deviceorientation', onTilt);
    window.addEventListener('pointermove', onMove);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('deviceorientation', onTilt);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <Canvas
      frameloop={visible ? 'always' : 'never'}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 4.2], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} />
      <pointLight position={[-4, -2, -3]} intensity={0.8} color="#ffffff" />
      <Blob tilt={tilt} />
    </Canvas>
  );
}
