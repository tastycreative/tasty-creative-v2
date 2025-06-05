"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import NavigationMenu from "./NavigationMenu";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TastyCreativeLanding = ({ session }: { session: any }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef(0);
  const scrollProgress = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [progress, setProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const aboutRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const servicesRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const workRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const contactRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const starsRef = useRef<THREE.Mesh[]>([]);
  const staticStarsRef = useRef<THREE.Object3D[]>([]);
  const constellationLinesRef = useRef<THREE.Group[]>([]);

  // Constellation patterns (simplified zodiac signs)
  const constellations = [
    {
      // Aries
      points: [
        [0, 0],
        [1, 1],
        [2, 0.5],
        [3, 1.5],
      ],
      connections: [
        [0, 1],
        [1, 2],
        [2, 3],
      ],
    },
    {
      // Leo
      points: [
        [0, 0],
        [1, 0.5],
        [2, 0],
        [2, -1],
        [3, 0.5],
        [4, 0],
      ],
      connections: [
        [0, 1],
        [1, 2],
        [2, 3],
        [2, 4],
        [4, 5],
      ],
    },
    {
      // Scorpio
      points: [
        [0, 0],
        [1, 1],
        [2, 0.5],
        [3, 1],
        [4, 0],
        [5, -0.5],
      ],
      connections: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
      ],
    },
    {
      // Orion
      points: [
        [0, 0],
        [0, 2],
        [2, 0],
        [2, 2],
        [1, 1],
        [1, -1],
        [1, 3],
      ],
      connections: [
        [0, 1],
        [2, 3],
        [0, 4],
        [1, 4],
        [2, 4],
        [3, 4],
        [4, 5],
        [4, 6],
      ],
    },
  ];

  // Initialize Three.js scene

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404080, 0.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x6366f1, 2);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x8b5cf6, 2);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    // Mouse light that follows cursor
    const mouseLight = new THREE.PointLight(0xffffff, 0, 3);
    scene.add(mouseLight);

    // Create spikey star geometry
    const createSpikeyStar = () => {
      const geometry = new THREE.BufferGeometry();
      const vertices = [];
      const spikes = 8;
      const innerRadius = 0.02;
      const outerRadius = 0.05;

      for (let i = 0; i < spikes * 2; i++) {
        const angle = (i / (spikes * 2)) * Math.PI * 2;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        vertices.push(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      }

      // Add center point
      vertices.push(0, 0, 0);

      // Create indices for triangles
      const indices = [];
      const centerIndex = spikes * 2;
      for (let i = 0; i < spikes * 2; i++) {
        indices.push(centerIndex, i, (i + 1) % (spikes * 2));
      }

      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3)
      );
      geometry.setIndex(indices);

      return geometry;
    };

    // Create stars
    const starGeometry = createSpikeyStar();
    const stars: THREE.Mesh[] = [];
    const starCount = 2000; // Increased star count for better coverage

    for (let i = 0; i < starCount; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(Math.random() * 0.1 + 0.6, 0.5, 0.8),
        transparent: true,
        opacity: Math.random() * 0.5 + 0.5,
      });

      const star = new THREE.Mesh(starGeometry, material);

      // Distribute stars to cover the full camera movement range plus viewing area
      // Camera moves from -10 to +10, so we need stars from about -25 to +25 to ensure coverage
      const x = (Math.random() - 0.5) * 50; // Range: -25 to +25
      const y = (Math.random() - 0.5) * 30; // Range: -15 to +15
      const z = Math.random() * 40 - 10; // Range: -10 to +30 (in front and behind camera)

      star.position.set(x, y, z);

      star.userData = {
        originalPosition: star.position.clone(),
        originalOpacity: material.opacity,
        flickerSpeed: Math.random() * 2 + 1,
        flickerOffset: Math.random() * Math.PI * 2,
      };

      scene.add(star);
      stars.push(star);
    }
    starsRef.current = stars;

    const staticStarCount = 1000;

    // Create a simpler star geometry for background stars
    const staticStarGeometry = new THREE.BufferGeometry();
    const staticVertices = [];

    for (let i = 0; i < staticStarCount; i++) {
      // Position stars in a large sphere around the origin
      const radius = 200 + Math.random() * 300; // Very far away
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      staticVertices.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );
    }

    staticStarGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(staticVertices, 3)
    );

    const staticStarMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: false, // Keep size constant regardless of distance
    });

    const staticStarField = new THREE.Points(
      staticStarGeometry,
      staticStarMaterial
    );
    scene.add(staticStarField);

    // Store reference for animation
    staticStarsRef.current = [staticStarField];

    // Create constellation lines (initially invisible)
    const constellationMaterial = new THREE.LineBasicMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0,
      linewidth: 2,
    });

    const constellationGroups: THREE.Group[] = [];
    constellations.forEach((constellation, index) => {
      const group = new THREE.Group();
      const scale = 2;
      // Distribute constellations across the camera movement range
      const sectionWidth = 10; // Matches camera movement range
      const offsetX = -15 + index * sectionWidth + (Math.random() - 0.5) * 4;
      const offsetY = (Math.random() - 0.5) * 10;
      const offsetZ = (Math.random() - 0.5) * 10 + 5; // Keep them in front of camera

      constellation.connections.forEach(([start, end]) => {
        const points = [
          new THREE.Vector3(
            constellation.points[start][0] * scale + offsetX,
            constellation.points[start][1] * scale + offsetY,
            offsetZ
          ),
          new THREE.Vector3(
            constellation.points[end][0] * scale + offsetX,
            constellation.points[end][1] * scale + offsetY,
            offsetZ
          ),
        ];

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, constellationMaterial.clone());
        line.userData = { fadeIn: false, targetOpacity: 0.6 };
        group.add(line);
      });

      scene.add(group);
      constellationGroups.push(group);
    });
    constellationLinesRef.current = constellationGroups;

    // Animation
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      // Update mouse light position
      const mouse3D = new THREE.Vector3(
        mouseRef.current.x * 10,
        mouseRef.current.y * 10,
        2
      );
      mouseLight.position.copy(mouse3D);

      // Animate stars
      stars.forEach((star) => {
        // Flickering
        const flicker =
          Math.sin(
            time * star.userData.flickerSpeed + star.userData.flickerOffset
          ) *
            0.5 +
          0.5;
        (star.material as THREE.MeshBasicMaterial).opacity =
          star.userData.originalOpacity * (0.3 + flicker * 0.7);

        // Gentle floating motion
        star.position.y =
          star.userData.originalPosition.y +
          Math.sin(time * 0.5 + star.userData.flickerOffset) * 0.2;

        // Rotation
        star.rotation.z += 0.01;
      });

      // Randomly show constellations
      constellationGroups.forEach((group) => {
        group.children.forEach((line) => {
          if (Math.random() < 0.001 && !line.userData.fadeIn) {
            line.userData.fadeIn = true;
            setTimeout(() => {
              line.userData.fadeIn = false;
            }, 5000);
          }

          if (line.userData.fadeIn) {
            ((line as THREE.Line).material as THREE.LineBasicMaterial).opacity =
              Math.min(
                (((line as THREE.Line).material as THREE.LineBasicMaterial)
                  .opacity ?? 0) + 0.01,
                line.userData.targetOpacity
              );
          } else {
            ((line as THREE.Line).material as THREE.LineBasicMaterial).opacity =
              Math.max(
                (((line as THREE.Line).material as THREE.LineBasicMaterial)
                  .opacity ?? 0) - 0.005,
                0
              );
          }
        });
      });

      // Smooth camera movement based on scroll
      const targetX = scrollProgress.current * 20 - 10; // Range from -10 to 10
      camera.position.x += (targetX - camera.position.x) * 0.1;
      camera.position.y = Math.sin(scrollProgress.current * Math.PI * 2) * 2; // Gentle vertical wave
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Handle mouse move
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      if (mountRef.current && renderer.domElement) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle wheel event for automatic scrolling to sections with progress update
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (contentRef.current) {
        // Prevent vertical scrolling
        e.preventDefault();
        // Determine the current section based on scroll position
        const currentScrollLeft = contentRef.current.scrollLeft;
        const sectionWidth = window.innerWidth; // Assuming each section takes full width
        const currentSectionIndex = Math.round(
          currentScrollLeft / sectionWidth
        );
        // Determine the next section index based on scroll direction
        let nextSectionIndex = currentSectionIndex;
        const maxSectionIndex = 4; // total number of sections -1
        if (e.deltaY > 0) {
          // Scrolling down
          nextSectionIndex = Math.min(currentSectionIndex + 1, maxSectionIndex);
        } else {
          // Scrolling up
          nextSectionIndex = Math.max(currentSectionIndex - 1, 0);
        }

        // Scroll to the next section
        const sections = [heroRef, aboutRef, servicesRef, workRef, contactRef];
        const nextSectionRef = sections[nextSectionIndex];
        scrollToSection(nextSectionRef);
        // Update progress state as percentage
        const newProgress = (nextSectionIndex / maxSectionIndex) * 100;
        setProgress(newProgress);
        scrollProgress.current = nextSectionIndex / maxSectionIndex;
      }
    };
    const container = contentRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, []);
  // Smooth scroll to section

  // Smooth scroll to section
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", inline: "center" });
    setMenuOpen(false);
  };

  const createStarPath = (
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ) => {
    let path = "";
    const step = Math.PI / spikes;

    for (let i = 0; i < 2 * spikes; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = cx + Math.cos(i * step - Math.PI / 2) * radius;
      const y = cy + Math.sin(i * step - Math.PI / 2) * radius;

      if (i === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    }
    path += " Z";
    return path;
  };

  return (
    <div className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-black dark:text-white overflow-hidden h-screen">
      {/* Custom Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-900 z-50">
        <div
          className="h-full bg-gradient-to-b from-indigo-950 via-purple-500 to-black transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
        {/* Shooting stars with star shapes */}
        <div className="absolute top-[10%] left-[20%] animate-[shootingStar_8s_linear_infinite]">
          <svg
            width="30"
            height="30"
            viewBox="0 0 30 30"
            className="relative animate-spin"
          >
            <defs>
              <linearGradient
                id="shootingGrad1"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="white" stopOpacity="0.8" />
                <stop offset="100%" stopColor="white" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path
              d={createStarPath(15, 15, 5, 8, 3)}
              fill="white"
              filter="drop-shadow(0 0 6px rgba(255, 255, 255, 0.9))"
            />
            {/* <rect x="-60" y="12" width="70" height="6" fill="url(#shootingGrad1)" opacity="0.8" /> */}
          </svg>
        </div>

        <div className="absolute top-[60%] right-[30%] animate-[shootingStar_12s_linear_infinite_4s]">
          <svg
            width="25"
            height="25"
            viewBox="0 0 25 25"
            className="relative animate-spin"
          >
            <defs>
              <linearGradient
                id="shootingGrad2"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="#93c5fd" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#93c5fd" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path
              d={createStarPath(12.5, 12.5, 6, 7, 2.5)}
              fill="#93c5fd"
              filter="drop-shadow(0 0 5px rgba(147, 197, 253, 0.8))"
            />
            {/* <rect x="-50" y="10" width="55" height="5" fill="url(#shootingGrad2)" opacity="0.7" /> */}
          </svg>
        </div>

        <div className="absolute top-[30%] left-[70%]  animate-[shootingStar_15s_linear_infinite_7s]">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="relative animate-spin"
          >
            <defs>
              <linearGradient
                id="shootingGrad3"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="#c4b5fd" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#c4b5fd" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path
              d={createStarPath(10, 10, 4, 6, 2)}
              fill="#c4b5fd"
              filter="drop-shadow(0 0 4px rgba(196, 181, 253, 0.7))"
            />
            {/* <rect x="-40" y="8" width="45" height="4" fill="url(#shootingGrad3)" opacity="0.6" /> */}
          </svg>
        </div>
      </div>

      {/* Three.js Canvas */}
      <div
        ref={mountRef}
        className="fixed top-0 left-0 w-full h-full transition-all duration-300 "
        style={{ zIndex: 1 }}
      />

      <NavigationMenu
        scrollToSection={scrollToSection}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        heroRef={heroRef}
        aboutRef={aboutRef}
        servicesRef={servicesRef}
        workRef={workRef}
        contactRef={contactRef}
        session={session}
      />

      {/* Horizontal Scrolling Content */}
      <div
        ref={contentRef}
        className="absolute inset-0 overflow-x-auto overflow-y-hidden z-10 hide-scrollbar"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <div className="flex h-full" style={{ width: "500vw" }}>
          {/* Hero Section */}
          <section
            ref={heroRef}
            className="w-screen h-full flex items-center justify-center px-6 flex-shrink-0"
          >
            <div className="text-center">
              <h2 className="text-6xl md:text-8xl font-bold mb-6 opacity-0 animate-fadeInUp">
                <span className="bg-gradient-to-b from-indigo-950 via-purple-500 to-black bg-clip-text text-transparent">
                  Tasty
                </span>
                <br />
                <span className="text-slate-800 dark:text-white">Creative</span>
              </h2>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 opacity-0 animate-fadeInUp animation-delay-200">
                Crafting Digital Experiences Beyond Imagination
              </p>
              <button
                onClick={() => scrollToSection(aboutRef)}
                className="px-8 py-4 bg-gradient-to-b from-indigo-950 via-purple-500 to-black rounded-full font-semibold hover:scale-105 transition-transform opacity-0 animate-fadeInUp animation-delay-400"
              >
                Explore →
              </button>
            </div>
          </section>

          {/* About Section */}
          <section
            ref={aboutRef}
            className="w-screen h-full flex items-center justify-center px-6 flex-shrink-0"
          >
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-4xl md:text-5xl font-bold mb-6">
                  About Us
                </h3>
                <p className="text-gray-300 mb-4">
                  Sample sample sample samples sample sample
                </p>
                <p className="text-gray-300">
                  Sample sample sample samples sample sampleSample sample sample
                  samples sample sampleSample sample sample samples sample
                  sampleSample sample sample samples sample sample
                </p>
              </div>
              <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-8 rounded-2xl backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-6xl font-bold text-indigo-500 mb-2">
                    50+
                  </div>
                  <p className="text-gray-300">Projects Completed</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-500">5+</div>
                    <p className="text-sm text-gray-300">Years Experience</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-500">
                      100%
                    </div>
                    <p className="text-sm text-gray-300">Client Satisfaction</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Services Section */}
          <section
            ref={servicesRef}
            className="w-screen h-full flex items-center px-6 flex-shrink-0"
          >
            <div className="max-w-6xl mx-auto w-full">
              <h3 className="text-4xl md:text-5xl font-bold text-center mb-16">
                Our Services
              </h3>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    title: "Web Design",
                    desc: "Sample sample sample samples sample sample",
                    icon: "🎨",
                  },
                  {
                    title: "Development",
                    desc: "Sample sample sample samples sample sample",
                    icon: "💻",
                  },
                  {
                    title: "Branding",
                    desc: "Sample sample sample samples sample sample",
                    icon: "✨",
                  },
                ].map((service, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-8 rounded-2xl backdrop-blur-sm hover:scale-105 transition-transform"
                  >
                    <div className="text-4xl mb-4">{service.icon}</div>
                    <h4 className="text-2xl font-bold mb-4">{service.title}</h4>
                    <p className="text-gray-300">{service.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Work Section */}
          <section
            ref={workRef}
            className="w-screen h-full flex items-center px-6 flex-shrink-0"
          >
            <div className="max-w-6xl mx-auto w-full">
              <h3 className="text-4xl md:text-5xl font-bold text-center mb-16">
                Our Work
              </h3>
              <div className="grid md:grid-cols-2 gap-8">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 aspect-video hover:scale-105 transition-transform"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <h4 className="text-2xl font-bold">Project {item}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section
            ref={contactRef}
            className="w-screen h-full flex items-center justify-center px-6 flex-shrink-0"
          >
            <div className="max-w-4xl mx-auto text-center">
              <h3 className="text-4xl md:text-5xl font-bold mb-8">
                Let&apos;s Create Something Stellar
              </h3>
              <p className="text-xl text-gray-300 mb-12">
                Sample sample sample samples sample sample
              </p>
              <button className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full font-semibold hover:scale-105 transition-transform">
                Get In Touch
              </button>
            </div>
          </section>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 1s ease-out forwards;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
        }

        @keyframes shootingStar {
          0% {
            transform: translateX(-100px) translateY(-100px) rotate(-45deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(100vw) translateY(100vh) rotate(-45deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default TastyCreativeLanding;
