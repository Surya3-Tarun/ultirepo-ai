import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Ambient background: a field of glowing green particles plus a rotating
 * alien-DNA helix made of two intertwined point strands. Particle count
 * is reduced on smaller/lower-powered screens so it degrades gracefully
 * instead of janking.
 */
export default function ParticleField({ density = "high" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const isSmallScreen = window.innerWidth < 768;
    const particleCount = isSmallScreen ? 250 : density === "high" ? 900 : 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 60;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Ambient particle field
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 160;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x0fff9a,
      size: 0.6,
      transparent: true,
      opacity: 0.55,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // DNA double-helix strand
    const helixGroup = new THREE.Group();
    const strandCount = isSmallScreen ? 60 : 140;
    const helixMaterialA = new THREE.MeshBasicMaterial({ color: 0x0fff9a });
    const helixMaterialB = new THREE.MeshBasicMaterial({ color: 0x25f4ee });
    const sphereGeometry = new THREE.SphereGeometry(0.35, 8, 8);

    for (let i = 0; i < strandCount; i += 1) {
      const t = i / strandCount;
      const angle = t * Math.PI * 8;
      const y = t * 70 - 35;

      const pointA = new THREE.Mesh(sphereGeometry, helixMaterialA);
      pointA.position.set(Math.cos(angle) * 10, y, Math.sin(angle) * 10);
      helixGroup.add(pointA);

      const pointB = new THREE.Mesh(sphereGeometry, helixMaterialB);
      pointB.position.set(Math.cos(angle + Math.PI) * 10, y, Math.sin(angle + Math.PI) * 10);
      helixGroup.add(pointB);
    }
    helixGroup.position.x = 45;
    helixGroup.position.z = -30;
    scene.add(helixGroup);

    let frameId;
    const animate = () => {
      particles.rotation.y += 0.0006;
      helixGroup.rotation.y += 0.004;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      sphereGeometry.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [density]);

  return <div ref={containerRef} className="absolute inset-0 -z-10 opacity-70" aria-hidden="true" />;
}
