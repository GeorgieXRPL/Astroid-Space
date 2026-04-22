/**
 * @fileoverview Stars: types and procedural generation.
 *
 * Astroid means "starlike" (Greek ἀστήρ + -οειδής). The 3D field is a
 * shell of stars you can name - distinct from the asteroid coin / asteroid
 * plushie / Asteroid Protocol communities, who orbit close but in their
 * own lane.
 *
 * Each star has a stable designation (e.g. "STAR-00042") so shareable
 * URLs and certificates remain consistent forever.
 */

export type StarSpectrum =
  | 'white-dwarf'
  | 'blue-giant'
  | 'yellow'
  | 'red-giant'
  | 'pulsar';

export interface Star {
  /** Stable unique designation, e.g. "STAR-00042" */
  id: string;
  /** Index within the field (0-based) */
  index: number;
  /** Spectral class - cosmetic only, drives color/glow */
  spectrum: StarSpectrum;
  /** Position in 3D space (celestial-shell distribution) */
  position: [number, number, number];
  /** Visual radius (relative units) */
  size: number;
  /** Twinkle phase seed for animation */
  twinklePhase: number;
}

export interface NamedStar {
  designation: string;
  /** Display name chosen by the namer */
  name: string;
  /** Optional dedication, e.g. "For my brother", "For Liv" */
  dedication?: string;
  /** Display name of the namer, optional */
  namedBy?: string;
  /** ISO timestamp */
  namedAt: string;
  /**
   * Random claim token returned to the client and stored in localStorage.
   * Lets the namer re-find their star later without an account/wallet.
   * Also lets the namer view their pending submission before it's approved.
   */
  claimToken: string;
  /**
   * Moderation state. New names land as `pending`; an admin must approve
   * before the name shows on the public site or appears in the certificate.
   * Pending submissions still claim the slot - admin reject frees it back.
   */
  status: 'pending' | 'approved' | 'rejected';
  /** True if the content filter flagged the submission for human attention. */
  suspicious?: boolean;
}

/**
 * Spectrum styling. Cool, painterly, planetarium-grade - not arcadey.
 * Emissive values intentionally high; these are stars, they emit light.
 */
export const STAR_STYLES: Record<
  StarSpectrum,
  {
    color: string;
    emissive: string;
    /** Used to bias the halo size */
    haloScale: number;
    label: string;
  }
> = {
  'white-dwarf': {
    color: '#f8fafc',
    emissive: '#e0e7ff',
    haloScale: 1.0,
    label: 'White Dwarf',
  },
  'blue-giant': {
    color: '#bae6fd',
    emissive: '#0284c7',
    haloScale: 1.4,
    label: 'Blue Giant',
  },
  yellow: {
    color: '#fef9c3',
    emissive: '#f59e0b',
    haloScale: 1.1,
    label: 'Yellow Star',
  },
  'red-giant': {
    color: '#fecaca',
    emissive: '#dc2626',
    haloScale: 1.5,
    label: 'Red Giant',
  },
  pulsar: {
    color: '#e9d5ff',
    emissive: '#9333ea',
    haloScale: 1.2,
    label: 'Pulsar',
  },
};

/** Total stars in the field. Tuned for visual density vs. perf. */
export const TOTAL_STARS = 200;

/**
 * Deterministic pseudo-random number generator (mulberry32).
 * Seeded so the field looks the same on every render and on every device.
 */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SPECTRA: StarSpectrum[] = ['white-dwarf', 'blue-giant', 'yellow', 'red-giant', 'pulsar'];

/**
 * Star spectrum frequencies - biased toward white/yellow stars (most common
 * in real life), with rarer giants and pulsars for visual interest.
 */
const SPECTRUM_WEIGHTS: Array<[StarSpectrum, number]> = [
  ['white-dwarf', 0.32],
  ['yellow', 0.32],
  ['blue-giant', 0.18],
  ['red-giant', 0.13],
  ['pulsar', 0.05],
];

function pickSpectrum(rand: () => number): StarSpectrum {
  const r = rand();
  let acc = 0;
  for (const [spectrum, weight] of SPECTRUM_WEIGHTS) {
    acc += weight;
    if (r <= acc) return spectrum;
  }
  return SPECTRA[0];
}

/**
 * Generate the star field. Distributes stars in a thick galactic-disk volume
 * (not a thin shell) so the scene reads as deep space rather than a
 * planetarium dome. Stars range from r ≈ 4 to r ≈ 60, biased toward an
 * equatorial plane. Closer stars get scaled up so distance produces real
 * parallax-like depth as the camera drifts through the field.
 */
export function generateStarField(seed = 42): Star[] {
  const rand = mulberry32(seed);
  const stars: Star[] = [];

  // Inner / outer radial bounds for the disk. The wide range is what makes
  // the field feel "vast" - stars genuinely sit at different depths.
  const R_MIN = 4;
  const R_MAX = 60;

  for (let i = 0; i < TOTAL_STARS; i++) {
    const designation = `STAR-${String(i + 1).padStart(5, '0')}`;

    // Azimuth: full circle.
    const theta = rand() * Math.PI * 2;

    // Radial: cube-root weighting biases toward the inner volume so the
    // density per unit volume stays roughly constant - without it, the
    // outer shell would visually swamp the close stars.
    const radius = R_MIN + Math.pow(rand(), 0.6) * (R_MAX - R_MIN);

    // Disk thickness: thin near the centre, slightly thicker far out.
    // h scales with radius so we get a true galactic-disk silhouette.
    const diskHalfThickness = 0.35 + radius * 0.12;
    // Box-Muller-ish: sum two uniforms for a soft gaussian look.
    const yJitter = (rand() + rand() - 1) * diskHalfThickness;

    const x = radius * Math.cos(theta);
    const y = yJitter;
    const z = radius * Math.sin(theta);

    // Apparent size compensates partially for distance - close stars are
    // bigger and brighter, but distant ones don't disappear entirely.
    // 0.04 floor + scaling that drops with sqrt(radius) keeps far stars
    // legible while letting near stars feel close.
    const distanceFactor = 1 / Math.sqrt(radius / R_MIN);
    const baseSize = 0.05 + rand() * 0.09;
    const size = baseSize * (0.6 + distanceFactor * 0.8);

    stars.push({
      id: designation,
      index: i,
      spectrum: pickSpectrum(rand),
      position: [x, y, z],
      size,
      twinklePhase: rand() * Math.PI * 2,
    });
  }

  return stars;
}

/** Memoized field - computed once on first call */
let _cachedField: Star[] | null = null;
export function getStarField(): Star[] {
  if (!_cachedField) {
    _cachedField = generateStarField();
  }
  return _cachedField;
}

export function getStarByDesignation(designation: string): Star | undefined {
  return getStarField().find((s) => s.id === designation);
}

/** Validate that a designation matches the expected format */
export function isValidDesignation(designation: string): boolean {
  return /^STAR-\d{5}$/.test(designation);
}

/**
 * Generate a short random claim token. Returned to the client at name-time
 * and stored in localStorage so the namer can re-find their star.
 * NOT a security token - it's a recovery key, not an auth credential.
 */
export function generateClaimToken(): string {
  // 16 hex chars ≈ 64 bits of entropy. Plenty for collision avoidance.
  const bytes = new Uint8Array(8);
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
