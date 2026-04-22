'use client';

/**
 * @fileoverview Close-up 3D render of a single star.
 *
 * Used on the star detail page (/sky/[designation]) to replace the static
 * CSS blur preview. We render a sphere with a custom shader that simulates:
 *
 *   - Convection-cell granulation (animated 3D simplex fBm)
 *   - Limb darkening (cos-law falloff toward the edge)
 *   - Spectral colour mixing (cool / mid / hot tones blended by surface heat)
 *
 * Around it we layer additive billboards for the corona, an inner glow, and
 * a 4-point diffraction spike, then run bloom + ACES tone mapping over the
 * whole thing. Result reads close to a real telescope close-up of a star.
 */

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { KernelSize } from 'postprocessing';
import * as THREE from 'three';
import { STAR_STYLES, type StarSpectrum } from '../../lib/stars';

interface StarOrbProps {
  spectrum: StarSpectrum;
  /** When true, render a faster, more aggressive pulse (used for "named" or pulsar feel). */
  emphasize?: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Shader                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * 3D simplex noise - Ashima Arts / Ian McEwan, public domain.
 * Used by the fragment shader to produce convection-cell granulation.
 */
const SIMPLEX_NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(
            i.z+vec4(0.0,i1.z,i2.z,1.0))
          + i.y+vec4(0.0,i1.y,i2.y,1.0))
          + i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

const VERTEX_SHADER = /* glsl */ `
varying vec3 vNormalView;
varying vec3 vLocal;
void main() {
  vNormalView = normalize(normalMatrix * normal);
  vLocal = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
${SIMPLEX_NOISE}

uniform float uTime;
uniform vec3 uCool;
uniform vec3 uMid;
uniform vec3 uHot;
uniform float uTurbulence;
uniform float uGranScale;
uniform float uLimbStrength;
uniform float uBrightness;

varying vec3 vNormalView;
varying vec3 vLocal;

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * snoise(p);
    p *= 2.07;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 nrm = normalize(vNormalView);
  // Camera looks down -Z in view space, so the +Z axis points back to it.
  float ndotv = clamp(dot(nrm, vec3(0.0, 0.0, 1.0)), 0.0, 1.0);

  // Limb darkening - stars are dimmer at the edge.
  float limb = pow(ndotv, uLimbStrength);

  // Two octaves of fBm at different scales for fine + coarse granulation.
  vec3 p = vLocal * uGranScale + vec3(uTime * 0.06, uTime * 0.04, uTime * 0.05);
  float n1 = fbm(p);
  float n2 = fbm(p * 3.4 + vec3(uTime * uTurbulence));
  float gran = 0.5 + 0.45 * n1 + 0.18 * n2;

  // Map granulation to the 3-stop spectral gradient.
  vec3 col = mix(uCool, uMid, smoothstep(0.15, 0.55, gran));
  col = mix(col, uHot, smoothstep(0.6, 0.95, gran));

  // Limb darkening applied as a multiplier - never fully zero, so the edge
  // still glows in the chromosphere tone.
  col *= 0.45 + limb * 0.75;

  // Hot-spot bloom: where granulation peaks, push the colour beyond 1.0
  // so the bloom pass can pick it up.
  float hotSpot = pow(max(0.0, gran - 0.65), 2.5) * 5.0;
  col += uHot * hotSpot;

  // Subtle rim brightening (chromosphere) right at the edge so the limb
  // doesn't look painted-on. Peaks where ndotv is small.
  float rim = pow(1.0 - ndotv, 4.0);
  col += uHot * rim * 0.6;

  col *= uBrightness;

  gl_FragColor = vec4(col, 1.0);
}
`;

/* -------------------------------------------------------------------------- */
/*  Spectrum -> shader colour palette                                          */
/* -------------------------------------------------------------------------- */

interface OrbPalette {
  cool: THREE.Color;
  mid: THREE.Color;
  hot: THREE.Color;
  /** outer corona tint */
  corona: THREE.Color;
  /** physical radius (sphere). Cosmetic. */
  radius: number;
  /** Drives noise turbulence speed. */
  turbulence: number;
  /** fBm spatial frequency. Larger = finer granulation cells. */
  granScale: number;
  /** Limb darkening exponent. 0.4–0.9 reads as a real star. */
  limb: number;
  /** Overall multiplier on emitted colour. */
  brightness: number;
}

function paletteFor(spectrum: StarSpectrum): OrbPalette {
  switch (spectrum) {
    case 'white-dwarf':
      return {
        cool: new THREE.Color('#a8c0ff'),
        mid: new THREE.Color('#e6efff'),
        hot: new THREE.Color('#ffffff'),
        corona: new THREE.Color('#cfddff'),
        radius: 0.85,
        turbulence: 0.5,
        granScale: 4.5,
        limb: 0.7,
        brightness: 1.45,
      };
    case 'blue-giant':
      return {
        cool: new THREE.Color('#1d3a80'),
        mid: new THREE.Color('#5b8fd6'),
        hot: new THREE.Color('#cce4ff'),
        corona: new THREE.Color('#7fb6ff'),
        radius: 1.25,
        turbulence: 0.55,
        granScale: 2.6,
        limb: 0.6,
        brightness: 1.4,
      };
    case 'yellow':
      // Sun-like
      return {
        cool: new THREE.Color('#7a2a05'),
        mid: new THREE.Color('#ff8a1f'),
        hot: new THREE.Color('#ffe7a8'),
        corona: new THREE.Color('#ffb24a'),
        radius: 1.0,
        turbulence: 0.45,
        granScale: 3.4,
        limb: 0.55,
        brightness: 1.2,
      };
    case 'red-giant':
      return {
        cool: new THREE.Color('#3a0a0a'),
        mid: new THREE.Color('#c83a18'),
        hot: new THREE.Color('#ffb38a'),
        corona: new THREE.Color('#e85a2a'),
        radius: 1.4,
        turbulence: 0.3,
        granScale: 2.0,
        limb: 0.5,
        brightness: 1.1,
      };
    case 'pulsar':
      return {
        cool: new THREE.Color('#1a043b'),
        mid: new THREE.Color('#7a2bd6'),
        hot: new THREE.Color('#f0c8ff'),
        corona: new THREE.Color('#b16cff'),
        radius: 0.7,
        turbulence: 1.2,
        granScale: 5.0,
        limb: 0.8,
        brightness: 1.6,
      };
  }
}

/* -------------------------------------------------------------------------- */
/*  Procedural sprite textures (radial gradient + diffraction spike)           */
/* -------------------------------------------------------------------------- */

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
      const along = Math.pow(Math.max(0, 1 - onAxis), 1.4);
      const across = Math.pow(Math.max(0, 1 - offAxis * 22), 2);
      const core = Math.pow(Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy)), 8);
      const a = Math.min(1, along * across + core * 0.55);
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

/* -------------------------------------------------------------------------- */
/*  The sphere + corona                                                        */
/* -------------------------------------------------------------------------- */

function StarSphere({ palette, emphasize }: { palette: OrbPalette; emphasize: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCool: { value: palette.cool },
      uMid: { value: palette.mid },
      uHot: { value: palette.hot },
      uTurbulence: { value: palette.turbulence },
      uGranScale: { value: palette.granScale },
      uLimbStrength: { value: palette.limb },
      uBrightness: { value: palette.brightness * (emphasize ? 1.1 : 1.0) },
    }),
    [palette, emphasize]
  );

  useFrame((state, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
    if (meshRef.current) {
      // Slow self-rotation so granulation appears to flow.
      meshRef.current.rotation.y += delta * 0.06;
      meshRef.current.rotation.x += delta * 0.015;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[palette.radius, 96, 96]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
      />
    </mesh>
  );
}

function Corona({
  palette,
  haloTex,
  spikeTex,
  emphasize,
}: {
  palette: OrbPalette;
  haloTex: THREE.Texture;
  spikeTex: THREE.Texture;
  emphasize: boolean;
}) {
  const innerRef = useRef<THREE.Sprite>(null);
  const outerRef = useRef<THREE.Sprite>(null);
  const spikeRef = useRef<THREE.Sprite>(null);

  const innerScale = palette.radius * 3.2;
  const outerScale = palette.radius * 6.0;
  const spikeScale = palette.radius * 9.0;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const breath = 1 + Math.sin(t * (emphasize ? 1.2 : 0.6)) * (emphasize ? 0.08 : 0.04);

    if (innerRef.current) innerRef.current.scale.setScalar(innerScale * breath);
    if (outerRef.current) outerRef.current.scale.setScalar(outerScale * breath);
    if (spikeRef.current) {
      spikeRef.current.scale.setScalar(spikeScale * breath);
      spikeRef.current.material.rotation = Math.sin(t * 0.15) * 0.05;
    }
  });

  return (
    <group>
      {/* Diffraction spikes - the unmistakable "real telescope photo" cue. */}
      <sprite ref={spikeRef} scale={spikeScale}>
        <spriteMaterial
          map={spikeTex}
          color={palette.corona}
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </sprite>

      {/* Outer soft corona */}
      <sprite ref={outerRef} scale={outerScale}>
        <spriteMaterial
          map={haloTex}
          color={palette.corona}
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </sprite>

      {/* Inner tight corona - sells the chromosphere edge */}
      <sprite ref={innerRef} scale={innerScale}>
        <spriteMaterial
          map={haloTex}
          color={palette.hot}
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </sprite>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*  Top-level                                                                  */
/* -------------------------------------------------------------------------- */

function StarOrbInner({ spectrum, emphasize = false }: StarOrbProps) {
  const palette = useMemo(() => paletteFor(spectrum), [spectrum]);
  const haloTex = useMemo(() => makeRadialTexture(256, 1.5), []);
  const spikeTex = useMemo(() => makeSpikeTexture(512), []);

  // Camera distance scaled to fit the whole star + corona comfortably in the
  // square frame regardless of palette radius.
  const camZ = 4 + palette.radius * 1.2;

  return (
    <Canvas
      camera={{ position: [0, 0, camZ], fov: 35, near: 0.1, far: 100 }}
      style={{ background: 'transparent' }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
    >
      <Suspense fallback={null}>
        <StarSphere palette={palette} emphasize={emphasize} />
        <Corona
          palette={palette}
          haloTex={haloTex}
          spikeTex={spikeTex}
          emphasize={emphasize}
        />

        <EffectComposer multisampling={0}>
          <Bloom
            intensity={1.4}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.55}
            kernelSize={KernelSize.LARGE}
            mipmapBlur
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}

export function StarOrb(props: StarOrbProps) {
  return (
    <div className="absolute inset-0">
      <StarOrbInner {...props} />
    </div>
  );
}
