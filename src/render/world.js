// Renderer, sky, lighting and the post chain.

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { P } from './palette.js';
import { glowMaterial } from './toon.js';

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Three stops rather than two. A single horizon->zenith ramp reads as a
// gradient wallpaper; the mid stop is what makes it read as atmosphere.
const SKY_FRAG = /* glsl */ `
  uniform vec3 uZenith, uMid, uHorizon;
  uniform float uTime;
  varying vec3 vDir;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    float h = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 col = mix(uHorizon, uMid, smoothstep(0.42, 0.62, h));
    col = mix(col, uZenith, smoothstep(0.58, 0.94, h));

    // Slow violet banding drifting across the upper sky — the gate's "ceiling"
    // is meant to feel like it is moving even when nothing else is.
    float band = sin(vDir.y * 7.0 - uTime * 0.09 + vDir.x * 1.6) * 0.5 + 0.5;
    col += vec3(0.05, 0.02, 0.09) * band * smoothstep(0.4, 1.0, h);

    // Dither. Eight-bit output across a gradient this wide bands visibly.
    col += (hash(gl_FragCoord.xy) - 0.5) * 0.006;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export class World {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(P.fog, P.fogNear, P.fogFar);

    this.camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.4, 400);
    this.camera.position.set(0, 6, 20);

    this._buildSky();
    this._buildLights();

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    // Strength is deliberately modest. Every glow in the game is toneMapped:false
    // so it sits above the threshold by design; at 0.62 the bloom turned each of
    // them into a white hole rather than a light source.
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.42, 0.7, 0.82);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.time = 0;
    this._onResize = () => this.resize();
    addEventListener('resize', this._onResize);
    this.resize();
  }

  _buildSky() {
    this.skyUniforms = {
      uZenith: { value: new THREE.Color(P.skyZenith) },
      uMid: { value: new THREE.Color(P.skyMid) },
      uHorizon: { value: new THREE.Color(P.skyHorizon) },
      uTime: { value: 0 },
    };
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(300, 32, 20),
      new THREE.ShaderMaterial({
        uniforms: this.skyUniforms,
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      })
    );
    sky.renderOrder = -100;
    this.scene.add(sky);
    this.sky = sky;

    // The gate's moon: broken, backlit, and the only hard shape in the sky.
    const moon = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CircleGeometry(15, 48), glowMaterial({ color: 0xe6d9ff }));
    moon.add(disc);
    const halo = new THREE.Mesh(
      new THREE.CircleGeometry(30, 48),
      glowMaterial({ color: P.violetGlow, transparent: true, opacity: 0.14, depthWrite: false })
    );
    halo.position.z = -0.5;
    moon.add(halo);
    // Fracture lines across the disc.
    for (let i = 0; i < 5; i++) {
      const crack = new THREE.Mesh(
        new THREE.PlaneGeometry(0.7 + Math.random() * 1.1, 6 + Math.random() * 12),
        glowMaterial({ color: P.violetDeep })
      );
      crack.position.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 14, 0.1);
      crack.rotation.z = Math.random() * Math.PI;
      moon.add(crack);
    }
    moon.position.set(-130, 96, -240);
    moon.lookAt(0, 20, 0);
    this.scene.add(moon);

    // Stars. Points, no attenuation, so they stay pin-sharp at any distance.
    const starCount = 700;
    const pos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      // Upper hemisphere only; below the horizon they'd sit inside the terrain.
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(Math.random() * 0.95 + 0.05);
      const r = 280;
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph);
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        color: 0xd9d0ff,
        size: 1.6,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.75,
        fog: false,
        toneMapped: false,
      })
    );
    stars.renderOrder = -99;
    this.scene.add(stars);
    this.stars = stars;
  }

  _buildLights() {
    // Key light. Warm, low and behind-left, so characters catch a rim and the
    // ground reads as raked rather than flat.
    const sun = new THREE.DirectionalLight(P.sunLight, 1.9);
    sun.position.set(-22, 30, 16);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 130;
    const s = 34;
    Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s });
    sun.shadow.bias = -0.0012;
    sun.shadow.normalBias = 0.035;
    this.scene.add(sun);
    this.scene.add(sun.target);
    this.sun = sun;

    // Sky/ground hemisphere: cool from above, violet bounce from below. This
    // is what keeps shadowed faces coloured instead of black.
    this.scene.add(new THREE.HemisphereLight(P.skyFill, P.groundBounce, 1.15));

    // A dim violet counter-light from the opposite side, no shadows.
    const fill = new THREE.DirectionalLight(P.sunDim, 0.55);
    fill.position.set(18, 12, -14);
    this.scene.add(fill);
  }

  /** Keep the shadow frustum centred on the action instead of the origin. */
  followShadows(x, y) {
    this.sun.position.set(x - 22, y + 30, 16);
    this.sun.target.position.set(x, y, 0);
    this.sun.target.updateMatrixWorld();
  }

  resize() {
    const w = innerWidth;
    const h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  update(dt) {
    this.time += dt;
    this.skyUniforms.uTime.value = this.time;
    // Sky and stars ride with the camera so they never parallax.
    this.sky.position.copy(this.camera.position);
    this.stars.position.copy(this.camera.position);
  }

  render() {
    this.composer.render();
  }
}
