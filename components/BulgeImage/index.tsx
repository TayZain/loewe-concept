"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

// ── Shaders ──────────────────────────────────────────────────────────────────

const vert = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Exact Codrops/Olivier Larose bulge formula.
// uActive (0→1) mixes between the raw uv and the bulged uv so that
// at uActive=0 the image renders normally without any distortion.
const frag = /* glsl */`
  uniform sampler2D uTexture;
  uniform vec2      uMouse;
  uniform float     uRadius;
  uniform float     uStrength;
  uniform float     uActive;   // 0 = off, 1 = full bulge
  varying vec2 vUv;

  vec2 bulge(vec2 uv, vec2 center) {
    uv       -= center;
    float dist       = length(uv) / uRadius;
    float distPow    = pow(dist, 2.0);
    float amount     = uStrength / (1.0 + distPow);
    uv       *= amount;
    uv       += center;
    return uv;
  }

  void main() {
    vec2 bulgedUV = bulge(vUv, uMouse);
    vec2 finalUV  = mix(vUv, bulgedUV, uActive);
    gl_FragColor  = texture2D(uTexture, finalUV);
  }
`;

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  src: string;
  width: number;
  height: number;
  alt: string;
  sizes?: string;
};

export default function BulgeImage({ src, width, height, alt }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Live values — mutated directly, never trigger re-renders
  const mouse   = useRef({ x: 0.5, y: 0.5 });
  const target  = useRef({ x: 0.5, y: 0.5 });
  const active  = useRef(0);        // current uActive
  const wantActive = useRef(0);     // target uActive

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Renderer ────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(1); // intentional — keeps it looking like displaced rubber

    // ── Scene ────────────────────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    // Camera sitting back at z=1 looking at z=0 plane
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.01, 100);
    camera.position.z = 1;

    // ── Texture ──────────────────────────────────────────────────────────────
    const loader  = new THREE.TextureLoader();
    const texture = loader.load(src);
    texture.colorSpace = THREE.SRGBColorSpace;

    // ── Material ─────────────────────────────────────────────────────────────
    const uniforms = {
      uTexture:  { value: texture },
      uMouse:    { value: new THREE.Vector2(0.5, 0.5) },
      uRadius:   { value: 0.55 },   // area of influence  (0.3–0.7 is nice range)
      uStrength: { value: 1.4 },    // bulge power — matches Codrops constant
      uActive:   { value: 0.0 },    // animated on hover
    };

    const material = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms });
    const mesh     = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    scene.add(mesh);

    // ── Render loop ──────────────────────────────────────────────────────────
    let rafId = 0;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const tick = () => {
      rafId = requestAnimationFrame(tick);

      mouse.current.x  = lerp(mouse.current.x,  target.current.x,  0.08);
      mouse.current.y  = lerp(mouse.current.y,  target.current.y,  0.08);
      active.current   = lerp(active.current,   wantActive.current, 0.07);

      uniforms.uMouse.value.set(mouse.current.x, mouse.current.y);
      uniforms.uActive.value = active.current;

      renderer.render(scene, camera);
    };

    tick();

    return () => {
      cancelAnimationFrame(rafId);
      texture.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [src, width, height]);

  // ── Event handlers ────────────────────────────────────────────────────────
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = canvasRef.current!.getBoundingClientRect();
    target.current = {
      x: (e.clientX - r.left) / r.width,
      y: 1 - (e.clientY - r.top) / r.height,  // flip Y for WebGL
    };
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: "block", width: "100%", height: "100%" }}
      aria-label={alt}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => { wantActive.current = 1; }}
      onMouseLeave={() => { wantActive.current = 0; }}
    />
  );
}
