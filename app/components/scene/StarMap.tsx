'use client';

/**
 * @fileoverview 3D star map scene.
 *
 * Built to feel like an exploration probe drifting through a galactic disk,
 * not a planetarium dome.
 *
 * Key realism / scale moves:
 * - Stars are billboarded additive sprites (radial gradient texture). With
 *   bloom, they read as luminous points instead of opaque marbles.
 * - The named-star field is volumetric - radii from ~4 to ~60 units, biased
 *   toward an equatorial disk. Distance gives natural parallax.
 * - In hero mode the camera doesn't orbit a centre - it drifts forward
 *   through the field with subtle bob and roll, like a slow probe.
 * - In interactive mode you can pan + zoom out far (max distance 100) so
 *   the field reads as a place, not a fishbowl.
 * - A "Milky Way" colour band, layered nebulae, and foreground dust
 *   particles add depth that pure point-stars can't.
 * - ACES filmic tone mapping + bloom gives proper HDR-style highlights.
 */

import { useRef, useMemo, useState, Suspense, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars as DeepStars, Html } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import * as THREE from 'three';
import { useRouter } from 'next/navigation';
import { getStarField, STAR_STYLES, type Star } from '../../lib/stars';

interface StarMapProps {
  /** Set of designations that have been named (for highlighting) */
  namedDesignations?: Set<string>;
  /** Optional designation to focus camera on initially */
  focusedDesignation?: string;
  /** Click handler - defaults to navigating to /sky/[designation] */
  onStarClick?: (star: Star) => void;
  /** Disable user interaction (for hero scenes) */
  interactive?: boolean;
  /** Drift the camera through the field (for hero scenes) */
  autoRotate?: boolean;
}

interface StarPointProps {
  star: Star;
  isNamed: boolean;
  isFocused: boolean;
  onClick: () => void;
  interactive: boolean;
  textures: StarTextures;
}

/* -------------------------------------------------------------------------- */
/*  Procedural textures                                                        */
/* -------------------------------------------------------------------------- */

interface StarTextures {
  core: THREE.Texture;
  halo: THREE.Texture;
  spike: THREE.Texture;
  nebula: THREE.Texture;
  dust: THREE.Texture;
}

/**
 * A radial gradient sprite, white-on-transparent. Tinted at draw time via
 * material color so we only need one texture for all star colors.
 *
 * @param sharpness - exponent applied to the falloff. Higher = tighter core.
 */
function makeRadialTexture(size: number, sharpness: number): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const img = ctx.createImageData(size, size);
  const data = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - cx) / cx;
      const dy = (y - cx) / cx;
      const d = Math.sqrt(dx * dx + dy * dy);
      const v = Math.max(0, 1 - d);
      const a = Math.pow(v, sharpness);
      const i = (y * size + x) * 4;
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = Math.round(a * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 4-point diffraction spike - the "+" pattern your eye uses to recognise a
 * bright star in a photograph. White, transparent, additive.
 */
function makeSpikeTexture(size: number): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const img = ctx.createImageData(size, size);
  const data = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = Math.abs((x - cx) / cx);
      const dy = Math.abs((y - cx) / cx);
      const offAxis = Math.min(dx, dy);
      const onAxis = Math.max(dx, dy);
      const along = Math.pow(Math.max(0, 1 - onAxis), 1.5);
      const across = Math.pow(Math.max(0, 1 - offAxis * 18), 2);
      const core = Math.pow(Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy)), 6);
      const a = Math.min(1, along * across + core * 0.6);
      const i = (y * size + x) * 4;
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = Math.round(a * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * A noisy, soft cloud texture for the Milky Way band and large nebulae.
 * Built from layered low-frequency value noise - good enough to break up
 * the visual without shipping any image assets.
 */
function makeCloudTexture(size: number): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const img = ctx.createImageData(size, size);
  const data = img.data;

  // Tiny seeded PRNG for repeatable noise.
  let s = 0x9e3779b1;
  const rnd = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // Coarse noise grid then smooth-sampled in the loop below.
  const N = 32;
  const noise: number[] = [];
  for (let i = 0; i < N * N; i++) noise.push(rnd());
  const sample = (u: number, v: number) => {
    const x = u * (N - 1);
    const y = v * (N - 1);
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const x1 = Math.min(N - 1, x0 + 1);
    const y1 = Math.min(N - 1, y0 + 1);
    const a = noise[y0 * N + x0];
    const b = noise[y0 * N + x1];
    const c = noise[y1 * N + x0];
    const d = noise[y1 * N + x1];
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    return (
      a * (1 - sx) * (1 - sy) +
      b * sx * (1 - sy) +
      c * (1 - sx) * sy +
      d * sx * sy
    );
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - cx) / cx;
      const dy = (y - cx) / cx;
      const d = Math.sqrt(dx * dx + dy * dy);
      // Two octaves of noise + radial falloff.
      const n =
        sample(x / size, y / size) * 0.65 +
        sample((x * 2.3) / size, (y * 2.3) / size) * 0.35;
      const radial = Math.max(0, 1 - d);
      const a = Math.pow(radial, 1.3) * Math.pow(n, 1.4);
      const i = (y * size + x) * 4;
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = Math.round(Math.min(1, a) * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/* -------------------------------------------------------------------------- */
/*  Background structures                                                      */
/* -------------------------------------------------------------------------- */

interface NebulaCloud {
  position: [number, number, number];
  scale: number;
  color: string;
  opacity: number;
  rotation?: number;
}

function generateNebulae(): NebulaCloud[] {
  // Hand-tuned, deliberately few and large. Sit far beyond the star shell.
  return [
    { position: [-60, 6, -90], scale: 110, color: '#3b3a8a', opacity: 0.32 },
    { position: [70, -10, -85], scale: 130, color: '#7a2a6a', opacity: 0.22 },
    { position: [10, 22, 95], scale: 100, color: '#1f5d8a', opacity: 0.28 },
    { position: [-55, -18, 80], scale: 90, color: '#6b3a1f', opacity: 0.18 },
    { position: [40, -40, -10], scale: 80, color: '#1f3d6b', opacity: 0.22 },
    { position: [-30, 40, 30], scale: 70, color: '#5a1f6b', opacity: 0.18 },
  ];
}

function NebulaField({ texture }: { texture: THREE.Texture }) {
  const clouds = useMemo(() => generateNebulae(), []);
  return (
    <group>
      {clouds.map((c, i) => (
        <sprite key={i} position={c.position} scale={c.scale}>
          <spriteMaterial
            map={texture}
            color={c.color}
            transparent
            opacity={c.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
          />
        </sprite>
      ))}
    </group>
  );
}

/**
 * Milky Way style band: a long stretched cloud sprite tilted across the
 * scene. Suggests a galactic plane the explorer is moving through.
 */
function GalacticBand({ texture }: { texture: THREE.Texture }) {
  return (
    <group rotation={[0.15, 0, 0.4]}>
      <sprite position={[0, 0, -60]} scale={[260, 50, 1]}>
        <spriteMaterial
          map={texture}
          color="#5a4a8a"
          transparent
          opacity={0.32}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </sprite>
      <sprite position={[10, -2, -55]} scale={[200, 32, 1]}>
        <spriteMaterial
          map={texture}
          color="#9a4a6a"
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </sprite>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*  Foreground dust (parallax cue)                                             */
/* -------------------------------------------------------------------------- */

/**
 * Tiny additive specks distributed in a slab close to the camera. They drift
 * past as the camera moves, providing a strong "I'm flying through space"
 * parallax cue that distant stars can't deliver.
 */
function DustField({ texture, count = 600 }: { texture: THREE.Texture; count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Slab in front of the camera origin.
      positions[i * 3 + 0] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
      sizes[i] = 0.06 + Math.random() * 0.18;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const m = new THREE.PointsMaterial({
      map: texture,
      size: 0.4,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: '#cfd6ff',
    });
    return { geometry: g, material: m };
  }, [texture, count]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    // Slow swirl - gives the dust a sense of being agitated by motion.
    ref.current.rotation.y += delta * 0.02;
    ref.current.rotation.x += delta * 0.008;
  });

  return <points ref={ref} geometry={geometry} material={material} />;
}

/* -------------------------------------------------------------------------- */
/*  Camera drift (explorer feel)                                               */
/* -------------------------------------------------------------------------- */

/**
 * Slowly drifts the camera along a smooth path through the field, with
 * subtle bob and roll. Enabled only when interactive is false (i.e. on
 * hero sections) - interactive mode hands control to OrbitControls.
 */
function CameraDrift({ enabled }: { enabled: boolean }) {
  const { camera } = useThree();
  const startRef = useRef<{ pos: THREE.Vector3; rot: THREE.Euler } | null>(null);
  useFrame((state, delta) => {
    if (!enabled) return;
    if (!startRef.current) {
      startRef.current = {
        pos: camera.position.clone(),
        rot: camera.rotation.clone(),
      };
    }
    const t = state.clock.elapsedTime;

    // Slow circular path so the camera sweeps through the volume rather
    // than translating in a straight line forever (which would eventually
    // exit the field).
    const r = 6;
    const speed = 0.06;
    const x = Math.cos(t * speed) * r;
    const z = Math.sin(t * speed) * r * 0.6 - 4;
    const y = Math.sin(t * speed * 0.7) * 1.4;

    camera.position.set(x, y, z);
    // Look slightly ahead of motion direction for the "explorer cockpit"
    // feel - gives the parallax direction more coherence.
    const look = new THREE.Vector3(
      Math.cos(t * speed + 0.3) * (r + 2),
      Math.sin(t * speed * 0.7 + 0.2) * 1.0,
      Math.sin(t * speed + 0.3) * r * 0.6 - 8
    );
    camera.lookAt(look);

    // Touch of roll for that "drifting in zero-g" feel.
    camera.rotation.z += Math.sin(t * 0.25) * 0.0008;
    delta;
  });
  return null;
}

/* -------------------------------------------------------------------------- */
/*  Star sprite                                                                */
/* -------------------------------------------------------------------------- */

/**
 * A single star: an additive halo sprite, an additive core sprite, and (for
 * bright/named stars) a 4-point diffraction spike sprite. An invisible mesh
 * sphere acts as the click/hover hit target.
 */
function StarPoint({
  star,
  isNamed,
  isFocused,
  onClick,
  interactive,
  textures,
}: StarPointProps) {
  const coreRef = useRef<THREE.Sprite>(null);
  const haloRef = useRef<THREE.Sprite>(null);
  const spikeRef = useRef<THREE.Sprite>(null);
  const [hovered, setHovered] = useState(false);

  const style = STAR_STYLES[star.spectrum];
  const isHighlighted = isNamed || hovered || isFocused;

  // Sprite scales - multiplied each frame by twinkle/pulse.
  const coreScale = useMemo(() => star.size * 4.0, [star.size]);
  const haloScale = useMemo(
    () => star.size * 12 * style.haloScale * (isNamed ? 1.6 : 1),
    [star.size, style.haloScale, isNamed]
  );
  const spikeScale = useMemo(
    () => star.size * 26 * style.haloScale * (isNamed ? 1.5 : 0.9),
    [star.size, style.haloScale, isNamed]
  );

  const showSpikes = isNamed || star.size > 0.085 || star.spectrum === 'blue-giant';

  const haloColor = isNamed ? '#e0f2ff' : style.color;
  const coreColor = isNamed ? '#ffffff' : style.color;
  const spikeColor = isNamed ? '#cfe9ff' : style.color;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const tw = 1 + Math.sin(t * 1.3 + star.twinklePhase) * 0.08;
    if (coreRef.current) coreRef.current.scale.setScalar(coreScale * tw);

    if (haloRef.current) {
      const pulse = isHighlighted
        ? 1 + Math.sin(t * 2 + star.twinklePhase) * 0.18
        : 1 + Math.sin(t * 0.8 + star.twinklePhase) * 0.06;
      haloRef.current.scale.setScalar(haloScale * pulse);
      const m = haloRef.current.material as THREE.SpriteMaterial;
      m.opacity = isNamed ? 0.55 : isHighlighted ? 0.42 : 0.28;
    }

    if (spikeRef.current) {
      const pulse = isHighlighted
        ? 1 + Math.sin(t * 1.6 + star.twinklePhase) * 0.14
        : 1 + Math.sin(t * 0.6 + star.twinklePhase) * 0.05;
      spikeRef.current.scale.setScalar(spikeScale * pulse);
      spikeRef.current.material.rotation =
        star.twinklePhase * 0.5 + Math.sin(t * 0.2 + star.twinklePhase) * 0.05;
    }
  });

  return (
    <group position={star.position}>
      {showSpikes && (
        <sprite ref={spikeRef} scale={spikeScale}>
          <spriteMaterial
            map={textures.spike}
            color={spikeColor}
            transparent
            opacity={isNamed ? 0.85 : 0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
          />
        </sprite>
      )}

      <sprite ref={haloRef} scale={haloScale}>
        <spriteMaterial
          map={textures.halo}
          color={haloColor}
          transparent
          opacity={isNamed ? 0.55 : 0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      <sprite ref={coreRef} scale={coreScale}>
        <spriteMaterial
          map={textures.core}
          color={coreColor}
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      {/* Invisible click/hover hit target. Larger than the visual core so
          small stars are still tappable on touch devices. */}
      <mesh
        onClick={
          interactive
            ? (e) => {
                e.stopPropagation();
                onClick();
              }
            : undefined
        }
        onPointerOver={interactive ? () => setHovered(true) : undefined}
        onPointerOut={interactive ? () => setHovered(false) : undefined}
        visible={false}
      >
        <sphereGeometry args={[Math.max(star.size * 3, 0.18), 8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {(hovered || isFocused) && interactive && (
        <Html
          position={[0, star.size * 4, 0]}
          center
          style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}
        >
          <div className="px-3 py-1.5 rounded-md bg-space-900/90 backdrop-blur-sm border border-cosmos/40 text-xs font-mono text-white">
            {star.id}
            {isNamed && <span className="ml-2 text-cosmos">● Named</span>}
          </div>
        </Html>
      )}
    </group>
  );
}

function StarGroup({
  stars,
  namedDesignations,
  focusedDesignation,
  onStarClick,
  interactive,
  textures,
}: {
  stars: Star[];
  namedDesignations: Set<string>;
  focusedDesignation?: string;
  onStarClick: (s: Star) => void;
  interactive: boolean;
  textures: StarTextures;
}) {
  return (
    <group>
      {stars.map((s) => (
        <StarPoint
          key={s.id}
          star={s}
          isNamed={namedDesignations.has(s.id)}
          isFocused={focusedDesignation === s.id}
          onClick={() => onStarClick(s)}
          interactive={interactive}
          textures={textures}
        />
      ))}
    </group>
  );
}

/** Loading fallback while three.js initialises */
function SceneLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-space-950">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-cosmos border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <div className="text-xs font-mono text-cosmos/70 tracking-widest uppercase">
          Mapping the sky
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Top-level                                                                  */
/* -------------------------------------------------------------------------- */

export function StarMap({
  namedDesignations = new Set(),
  focusedDesignation,
  onStarClick,
  interactive = true,
  autoRotate = false,
}: StarMapProps) {
  const router = useRouter();
  const stars = useMemo(() => getStarField(), []);

  const textures = useMemo<StarTextures>(
    () => ({
      core: makeRadialTexture(64, 2.2),
      halo: makeRadialTexture(128, 1.6),
      spike: makeSpikeTexture(256),
      nebula: makeCloudTexture(256),
      dust: makeRadialTexture(32, 2.0),
    }),
    []
  );

  const handleClick = useCallback(
    (star: Star) => {
      if (onStarClick) {
        onStarClick(star);
        return;
      }
      router.push(`/sky/${star.id}`);
    },
    [router, onStarClick]
  );

  // In hero/non-interactive mode we drive the camera ourselves and skip
  // OrbitControls entirely. In interactive mode we hand the camera over.
  const useDrift = !interactive && autoRotate;

  return (
    <div className="scene-container relative w-full h-full">
      <Suspense fallback={<SceneLoader />}>
        <Canvas
          camera={{ position: [0, 1.5, 14], fov: 72, near: 0.1, far: 400 }}
          style={{ background: 'transparent' }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
          }}
        >
          {/* Lighting: deliberately minimal - stars are emissive themselves. */}
          <ambientLight intensity={0.18} />

          {/* Galactic plane band - long soft tinted cloud */}
          <GalacticBand texture={textures.nebula} />

          {/* Distant nebula colour wash so the void isn't pure black */}
          <NebulaField texture={textures.nebula} />

          {/* Three layers of deep starfield: very far / mid / near, each with
              different sizes and speeds, so panning produces parallax. */}
          <DeepStars
            radius={300}
            depth={140}
            count={14000}
            factor={2.5}
            saturation={0.05}
            fade
            speed={0.15}
          />
          <DeepStars
            radius={180}
            depth={90}
            count={6000}
            factor={4}
            saturation={0.1}
            fade
            speed={0.3}
          />
          <DeepStars
            radius={90}
            depth={50}
            count={1800}
            factor={6}
            saturation={0.15}
            fade
            speed={0.55}
          />

          {/* Foreground dust - strong parallax cue when camera moves */}
          <DustField texture={textures.dust} count={500} />

          <StarGroup
            stars={stars}
            namedDesignations={namedDesignations}
            focusedDesignation={focusedDesignation}
            onStarClick={handleClick}
            interactive={interactive}
            textures={textures}
          />

          {useDrift && <CameraDrift enabled />}

          {interactive && (
            <OrbitControls
              enablePan
              enableZoom
              enableRotate
              autoRotate={autoRotate}
              autoRotateSpeed={0.2}
              minDistance={2}
              maxDistance={100}
              rotateSpeed={0.45}
              zoomSpeed={0.7}
              panSpeed={0.6}
            />
          )}

          {/* Post: bloom on emissive sprites + soft vignette */}
          <EffectComposer multisampling={0}>
            <Bloom
              intensity={1.25}
              luminanceThreshold={0.16}
              luminanceSmoothing={0.65}
              kernelSize={KernelSize.LARGE}
              mipmapBlur
            />
            <Vignette
              offset={0.2}
              darkness={0.78}
              blendFunction={BlendFunction.NORMAL}
            />
          </EffectComposer>
        </Canvas>
      </Suspense>

      {interactive && (
        <div className="absolute bottom-3 right-3 text-[10px] font-mono text-white/30 tracking-widest uppercase hidden sm:block pointer-events-none">
          Drag to rotate · Right-drag to pan · Scroll to zoom · Click a star
        </div>
      )}
    </div>
  );
}
