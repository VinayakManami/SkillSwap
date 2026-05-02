'use client';
import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

/** Animated floating node representing a skill */
function SkillNode({ position, color, scale = 1 }) {
  const ref = useRef();

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={ref} args={[0.15 * scale, 16, 16]} position={position}>
        <MeshDistortMaterial
          color={color}
          roughness={0.2}
          metalness={0.8}
          distort={0.2}
          speed={1.5}
          transparent
          opacity={0.85}
        />
      </Sphere>
    </Float>
  );
}

/** Animated connection line between two points */
function ConnectionLine({ start, end, color }) {
  const ref = useRef();

  useFrame((state) => {
    if (ref.current) {
      ref.current.material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  const [points] = useState(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(
        (start[0] + end[0]) / 2 + (Math.random() - 0.5) * 0.5,
        (start[1] + end[1]) / 2 + 0.5,
        (start[2] + end[2]) / 2
      ),
      new THREE.Vector3(...end)
    );
    return curve.getPoints(30);
  });

  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <line ref={ref} geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.4} linewidth={1} />
    </line>
  );
}

/** Rotating outer ring */
function OrbitRing({ radius, color }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z = state.clock.elapsedTime * 0.3;
      ref.current.rotation.x = Math.PI / 3;
    }
  });

  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, 0.008, 8, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} />
    </mesh>
  );
}

/** Main 3D scene showing skill network */
function SkillNetwork() {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  const nodes = [
    { pos: [0, 0, 0], color: '#6366f1', scale: 2 },
    { pos: [1.5, 0.8, 0.5], color: '#06b6d4', scale: 1.3 },
    { pos: [-1.2, 0.5, -0.8], color: '#f59e0b', scale: 1.1 },
    { pos: [0.8, -1, -0.5], color: '#10b981', scale: 1.2 },
    { pos: [-0.9, -0.8, 0.6], color: '#ec4899', scale: 1 },
    { pos: [1.8, -0.3, -0.3], color: '#8b5cf6', scale: 0.9 },
    { pos: [-1.6, -0.2, 0.4], color: '#14b8a6', scale: 0.8 },
    { pos: [0.3, 1.5, -0.2], color: '#f43f5e', scale: 1 },
  ];

  const connections = [
    { start: nodes[0].pos, end: nodes[1].pos, color: '#6366f1' },
    { start: nodes[0].pos, end: nodes[2].pos, color: '#06b6d4' },
    { start: nodes[0].pos, end: nodes[3].pos, color: '#f59e0b' },
    { start: nodes[0].pos, end: nodes[4].pos, color: '#10b981' },
    { start: nodes[1].pos, end: nodes[5].pos, color: '#8b5cf6' },
    { start: nodes[2].pos, end: nodes[6].pos, color: '#14b8a6' },
    { start: nodes[3].pos, end: nodes[7].pos, color: '#f43f5e' },
    { start: nodes[1].pos, end: nodes[3].pos, color: '#818cf8' },
    { start: nodes[4].pos, end: nodes[6].pos, color: '#22d3ee' },
  ];

  return (
    <group ref={groupRef}>
      {connections.map((c, i) => (
        <ConnectionLine key={`c-${i}`} start={c.start} end={c.end} color={c.color} />
      ))}
      {nodes.map((n, i) => (
        <SkillNode key={`n-${i}`} position={n.pos} color={n.color} scale={n.scale} />
      ))}
      <OrbitRing radius={2.2} color="#6366f1" />
      <OrbitRing radius={2.8} color="#06b6d4" />
    </group>
  );
}

/** Particles background */
function Particles({ count = 200 }) {
  const [points] = useState(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    return positions;
  });

  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={points} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#6366f1" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

export default function Hero3D() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }} dpr={[1, 1.5]} performance={{ min: 0.5 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={0.8} color="#6366f1" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#06b6d4" />
        <Particles />
        <SkillNetwork />
      </Canvas>
    </div>
  );
}
