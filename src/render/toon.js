// Toon shading + ink outlines.
//
// Two pieces make the look:
//
// 1. A banded gradient map on MeshToonMaterial. Quantising the diffuse term
//    into a few hard steps is what separates "cartoon" from "untextured 3D".
//    Everything else (shadows, fog, lights) comes free from three's own
//    material, which is why this is a MeshToonMaterial rather than a bespoke
//    ShaderMaterial.
//
// 2. A rim term injected via onBeforeCompile. Cel shading alone flattens a
//    silhouette against a dark background; a cool rim re-separates it, and it
//    doubles as the "lit by an otherworldly sky" cue the whole level leans on.

import * as THREE from 'three';
import { P } from './palette.js';

const gradientCache = new Map();

/**
 * A 1D texture of `steps` hard bands. NearestFilter is the entire point — any
 * filtering here reintroduces the gradient we are trying to destroy.
 */
export function gradientMap(steps = 4) {
  if (gradientCache.has(steps)) return gradientCache.get(steps);
  const data = new Uint8Array(steps);
  for (let i = 0; i < steps; i++) {
    // Bias the ramp so the lit side holds more range than the shadow side;
    // an even split makes everything read as half-dark.
    const t = (i + 1) / steps;
    data[i] = Math.round(Math.pow(t, 0.72) * 255);
  }
  const tex = new THREE.DataTexture(data, steps, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  gradientCache.set(steps, tex);
  return tex;
}

const RIM_CHUNK = /* glsl */ `
  float rimDot = 1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0);
  float rimAmt = smoothstep(uRimBias, 1.0, rimDot) * uRimPower;
  outgoingLight += uRimColor * rimAmt;
`;

/**
 * Cel-shaded material. `rim` of 0 disables the rim term (useful for terrain,
 * where every silhouette edge would otherwise glow).
 */
export function toonMaterial({
  color = 0xffffff,
  steps = 4,
  rim = 0.55,
  rimColor = P.skyFill,
  rimBias = 0.62,
  emissive = 0x000000,
  emissiveIntensity = 1,
  transparent = false,
  opacity = 1,
  fog = true,
  side = THREE.FrontSide,
  vertexColors = false,
} = {}) {
  // No `flatShading` option: MeshToonMaterial does not support it. Faceted
  // surfaces come from the geometry instead — see `faceted()` below.
  const mat = new THREE.MeshToonMaterial({
    color,
    gradientMap: gradientMap(steps),
    emissive,
    emissiveIntensity,
    transparent,
    opacity,
    fog,
    side,
    vertexColors,
  });

  if (rim > 0) {
    const uniforms = {
      uRimColor: { value: new THREE.Color(rimColor) },
      uRimPower: { value: rim },
      uRimBias: { value: rimBias },
    };
    mat.userData.rimUniforms = uniforms;
    mat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          '#include <common>\nuniform vec3 uRimColor;\nuniform float uRimPower;\nuniform float uRimBias;'
        )
        .replace('#include <opaque_fragment>', `${RIM_CHUNK}\n#include <opaque_fragment>`);
    };
    // Materials that differ only in onBeforeCompile must not share a program.
    mat.customProgramCacheKey = () => `rim${rim}|${rimBias}|${rimColor}`;
  }

  return mat;
}

/** Unlit, fog-free emissive material for glows, cores and magic. */
export function glowMaterial({ color = P.violet, opacity = 1, transparent = false, depthWrite = true } = {}) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent,
    opacity,
    fog: false,
    depthWrite,
    toneMapped: false, // keep it above the bloom threshold
  });
}

/**
 * Split shared vertices and recompute normals so every face shades flat.
 * MeshToonMaterial has no `flatShading` flag, so the facets have to be baked
 * into the geometry — which is also the cheaper option, since it happens once
 * at build time rather than per-fragment.
 */
export function faceted(geometry) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  g.computeVertexNormals();
  return g;
}

const OUTLINE_VERT = /* glsl */ `
  uniform float uThickness;
  uniform vec3 uCenter;
  void main() {
    // Expanding along the vertex's radial direction rather than its normal.
    // Box geometry has hard face normals, so a normal-expanded hull tears open
    // at every corner; the radial direction is continuous across the seam and
    // gives an unbroken silhouette on blocky models.
    vec3 dir = normalize(position - uCenter);
    vec3 p = position + dir * uThickness;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const OUTLINE_FRAG = /* glsl */ `
  uniform vec3 uColor;
  void main() { gl_FragColor = vec4(uColor, 1.0); }
`;

/**
 * Inverted-hull outline. Returns a child mesh to add alongside `mesh` — it
 * shares the geometry, so it costs a draw call and no memory.
 */
export function outlineFor(geometry, thickness = 0.035, color = P.outline) {
  if (!geometry.boundingSphere) geometry.computeBoundingSphere();
  const c = geometry.boundingSphere.center;
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uThickness: { value: thickness },
      uCenter: { value: new THREE.Vector3(c.x, c.y, c.z) },
      uColor: { value: new THREE.Color(color) },
    },
    vertexShader: OUTLINE_VERT,
    fragmentShader: OUTLINE_FRAG,
    side: THREE.BackSide,
    fog: false,
    toneMapped: false,
  });
  const outline = new THREE.Mesh(geometry, mat);
  outline.renderOrder = -1;
  return outline;
}

/**
 * Build a mesh plus its outline as one Object3D, so callers can treat an
 * outlined part as a single node.
 */
export function outlinedMesh(geometry, material, thickness = 0.035) {
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  if (thickness > 0) group.add(outlineFor(geometry, thickness));
  group.userData.mesh = mesh;
  return group;
}
