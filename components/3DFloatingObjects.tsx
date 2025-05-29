"use client";

import { useEffect, useState, useRef } from "react";

export default function Floating3DObjects() {
  const [mounted, setMounted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({
          x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
          y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Generate consistent random values for micro bubbles
  const microBubbles = mounted
    ? Array.from({ length: 15 }, (_, i) => ({
        id: i,
        size: 10 + ((i * 3) % 15),
        top: (i * 17) % 100,
        left: (i * 23) % 100,
        r: 155 + ((i * 20) % 100),
        g: 155 + ((i * 30) % 100),
        delay: (i * 0.7) % 10,
        duration: 10 + (i % 10),
      }))
    : [];

  // Generate twinkling stars
  const stars = mounted
    ? Array.from({ length: 150 }, (_, i) => ({
        id: i,
        size: 1 + ((i * 2) % 4), // Stars between 1-4px
        top: (i * 13) % 100,
        left: (i * 19) % 100,
        opacity: 0.3 + ((i * 7) % 70) / 100, // Opacity between 0.3-1.0
        delay: (i * 0.3) % 6, // Stagger twinkle animations
        duration: 2 + (i % 4), // Twinkle duration between 2-5s
        brightness: 0.5 + ((i * 11) % 50) / 100, // Brightness variation
      }))
    : [];

  // Generate larger constellation stars
  const constellationStars = mounted
    ? Array.from({ length: 25 }, (_, i) => ({
        id: i,
        size: 3 + ((i * 5) % 8), // Larger stars 3-10px
        top: (i * 29) % 100,
        left: (i * 37) % 100,
        delay: (i * 0.8) % 8,
        duration: 3 + (i % 5),
        pulseIntensity: 0.6 + ((i * 13) % 40) / 100,
      }))
    : [];

  if (!mounted) {
    return null; // Prevent SSR mismatch
  }

  return (
    <>
      {/* Twinkling Stars Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Small twinkling stars */}
        {stars.map((star) => (
          <div
            key={`star-${star.id}`}
            className="absolute rounded-full bg-white"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              top: `${star.top}%`,
              left: `${star.left}%`,
              opacity: star.opacity,
              animation: `twinkle ${star.duration}s ease-in-out infinite ${star.delay}s`,
              boxShadow: `0 0 ${star.size * 3}px rgba(255, 255, 255, ${
                star.brightness
              })`,
              transform: `translate(${mousePos.x * (2 + (star.id % 3))}px, ${
                mousePos.y * (2 + (star.id % 3))
              }px)`,
            }}
          />
        ))}

        {/* Larger constellation stars */}
        {constellationStars.map((star) => (
          <div
            key={`constellation-${star.id}`}
            className="absolute rounded-full bg-gradient-to-r from-blue-100 to-purple-100"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              top: `${star.top}%`,
              left: `${star.left}%`,
              animation: `starPulse ${star.duration}s ease-in-out infinite ${star.delay}s`,
              boxShadow: `0 0 ${star.size * 4}px rgba(147, 197, 253, ${
                star.pulseIntensity
              }), 0 0 ${star.size * 8}px rgba(196, 181, 253, ${
                star.pulseIntensity * 0.5
              })`,
              transform: `translate(${mousePos.x * (1 + (star.id % 2))}px, ${
                mousePos.y * (1 + (star.id % 2))
              }px)`,
            }}
          />
        ))}

        {/* Shooting stars */}
        <div className="absolute top-[10%] left-[20%] w-1 h-1 bg-white rounded-full animate-[shootingStar_8s_linear_infinite]">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent w-20 h-0.5 -translate-x-4 opacity-80"></div>
        </div>
        <div className="absolute top-[60%] right-[30%] w-1 h-1 bg-blue-200 rounded-full animate-[shootingStar_12s_linear_infinite_4s]">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-200 to-transparent w-16 h-0.5 -translate-x-3 opacity-70"></div>
        </div>
        <div className="absolute top-[30%] left-[70%] w-1 h-1 bg-purple-200 rounded-full animate-[shootingStar_15s_linear_infinite_7s]">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-200 to-transparent w-12 h-0.5 -translate-x-2 opacity-60"></div>
        </div>
      </div>

      {/* 3D Floating Objects */}
      <div ref={containerRef} className="absolute inset-0 overflow-hidden">
        {/* Large Bubble Cluster - Top Left */}
        <div
          className="absolute top-[5%] left-[10%] w-40 h-40 animate-[float_8s_ease-in-out_infinite] hover:scale-110 transition-transform duration-300 cursor-pointer"
          style={{
            transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)`,
          }}
        >
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-300/20 to-purple-400/20 rounded-full backdrop-blur-md border border-white/30 shadow-[inset_0_0_20px_rgba(255,255,255,0.5)]"></div>
            <div className="absolute top-2 left-3 w-8 h-8 bg-white/40 rounded-full blur-md"></div>
            <div className="absolute bottom-8 right-6 w-5 h-5 bg-white/30 rounded-full blur-sm"></div>
          </div>
        </div>

        {/* Floating Glass Sphere - Top Right */}
        <div
          className="absolute top-[15%] right-[20%] w-32 h-32 animate-[float_10s_ease-in-out_infinite_reverse] hover:scale-110 transition-transform duration-300 cursor-pointer"
          style={{
            transform: `translate(${mousePos.x * -15}px, ${mousePos.y * 15}px)`,
          }}
        >
          <div className="relative w-full h-full animate-[spin_20s_linear_infinite]">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/25 to-indigo-500/25 rounded-full backdrop-blur-sm border border-white/40 shadow-[0_8px_32px_rgba(99,102,241,0.3)]"></div>
            <div className="absolute top-3 left-4 w-6 h-6 bg-white/50 rounded-full blur-md"></div>
            <div className="absolute inset-4 bg-gradient-to-br from-transparent to-indigo-400/10 rounded-full"></div>
          </div>
        </div>

        {/* 3D Rotating Cube with Bubble Effect */}
        <div
          className="absolute top-[40%] left-[15%] w-28 h-28 animate-[float_7s_ease-in-out_infinite] hover:scale-125 transition-all duration-500 cursor-pointer"
          style={{
            transform: `translate(${mousePos.x * 25}px, ${mousePos.y * -20}px)`,
          }}
        >
          <div className="relative w-full h-full [transform-style:preserve-3d] animate-[rotateY_12s_linear_infinite] hover:animate-[rotateY_3s_linear_infinite]">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-300/30 to-pink-400/30 backdrop-blur-md rounded-2xl border border-white/30 [transform:rotateY(0deg)_translateZ(56px)] shadow-[inset_0_0_20px_rgba(255,255,255,0.3)]"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-300/30 to-purple-400/30 backdrop-blur-md rounded-2xl border border-white/30 [transform:rotateY(90deg)_translateZ(56px)] shadow-[inset_0_0_20px_rgba(255,255,255,0.3)]"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-300/30 to-indigo-400/30 backdrop-blur-md rounded-2xl border border-white/30 [transform:rotateY(180deg)_translateZ(56px)] shadow-[inset_0_0_20px_rgba(255,255,255,0.3)]"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-pink-300/30 to-blue-400/30 backdrop-blur-md rounded-2xl border border-white/30 [transform:rotateY(270deg)_translateZ(56px)] shadow-[inset_0_0_20px_rgba(255,255,255,0.3)]"></div>
          </div>
        </div>

        {/* Bubble Chain - Middle */}
        <div
          className="absolute top-[30%] right-[40%] animate-[float_9s_ease-in-out_infinite] hover:scale-110 transition-transform duration-300 cursor-pointer"
          style={{
            transform: `translate(${mousePos.x * -10}px, ${
              mousePos.y * -15
            }px)`,
          }}
        >
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-300/25 to-pink-400/25 rounded-full backdrop-blur-sm border border-white/30 shadow-[inset_0_0_15px_rgba(255,255,255,0.4)]"></div>
            <div className="absolute -bottom-8 left-4 w-16 h-16 bg-gradient-to-br from-indigo-300/25 to-purple-400/25 rounded-full backdrop-blur-sm border border-white/30"></div>
            <div className="absolute -bottom-14 left-8 w-12 h-12 bg-gradient-to-br from-blue-300/25 to-indigo-400/25 rounded-full backdrop-blur-sm border border-white/30"></div>
          </div>
        </div>

        {/* 3D Torus/Donut */}
        <div
          className="absolute bottom-[25%] right-[15%] w-36 h-36 animate-[float_11s_ease-in-out_infinite] hover:scale-110 transition-all duration-500 cursor-pointer"
          style={{
            transform: `translate(${mousePos.x * 30}px, ${mousePos.y * 25}px)`,
          }}
        >
          <div className="relative w-full h-full animate-[rotateXY_25s_linear_infinite] hover:animate-[rotateXY_5s_linear_infinite]">
            <div className="absolute inset-0 rounded-full border-[24px] border-pink-300/30 backdrop-blur-md shadow-[inset_0_0_25px_rgba(255,255,255,0.3),0_0_40px_rgba(236,72,153,0.2)]"></div>
            <div className="absolute inset-4 rounded-full border-[18px] border-purple-300/20"></div>
          </div>
        </div>

        {/* Floating Blob */}
        <div
          className="absolute top-[65%] left-[35%] w-24 h-24 animate-[float_8s_ease-in-out_infinite] hover:scale-125 transition-transform duration-300 cursor-pointer"
          style={{
            transform: `translate(${mousePos.x * -20}px, ${mousePos.y * 20}px)`,
          }}
        >
          <div className="relative w-full h-full animate-[morph_8s_ease-in-out_infinite] hover:animate-[morph_2s_ease-in-out_infinite]">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-300/30 to-purple-400/30 rounded-[40%_60%_60%_40%/60%_40%_60%_40%] backdrop-blur-md border border-white/25 shadow-[inset_0_0_20px_rgba(255,255,255,0.4)]"></div>
          </div>
        </div>

        {/* Glass Pyramid */}
        <div
          className="absolute bottom-[40%] left-[60%] w-24 h-24 animate-[float_13s_ease-in-out_infinite] hover:scale-110 transition-transform duration-300 cursor-pointer"
          style={{
            transform: `translate(${mousePos.x * 15}px, ${mousePos.y * -25}px)`,
          }}
        >
          <div className="relative w-full h-full [transform-style:preserve-3d] animate-[rotateY_18s_linear_infinite]">
            <div className="absolute bottom-0 left-1/2 w-0 h-0 -translate-x-1/2 border-l-[48px] border-r-[48px] border-b-[84px] border-l-transparent border-r-transparent border-b-purple-300/30 backdrop-blur-md shadow-[0_0_30px_rgba(168,85,247,0.3)]"></div>
            <div className="absolute bottom-0 left-1/2 w-0 h-0 -translate-x-1/2 rotate-90 border-l-[48px] border-r-[48px] border-b-[84px] border-l-transparent border-r-transparent border-b-indigo-300/30 backdrop-blur-md"></div>
          </div>
        </div>

        {/* Bubble Grid - Bottom Right */}
        <div
          className="absolute bottom-[10%] right-[30%] grid grid-cols-3 gap-2 animate-[float_10s_ease-in-out_infinite_reverse] hover:scale-110 transition-transform duration-300 cursor-pointer"
          style={{
            transform: `translate(${mousePos.x * -15}px, ${mousePos.y * 15}px)`,
          }}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-pink-300/30 to-purple-300/30 rounded-full backdrop-blur-sm border border-white/30"></div>
          <div className="w-10 h-10 bg-gradient-to-br from-purple-300/30 to-indigo-300/30 rounded-full backdrop-blur-sm border border-white/30 animate-[pulse_2s_ease-in-out_infinite]"></div>
          <div className="w-7 h-7 bg-gradient-to-br from-indigo-300/30 to-blue-300/30 rounded-full backdrop-blur-sm border border-white/30"></div>
          <div className="w-9 h-9 bg-gradient-to-br from-blue-300/30 to-pink-300/30 rounded-full backdrop-blur-sm border border-white/30 animate-[pulse_2s_ease-in-out_infinite_0.5s]"></div>
          <div className="w-8 h-8 bg-gradient-to-br from-pink-300/30 to-purple-300/30 rounded-full backdrop-blur-sm border border-white/30"></div>
          <div className="w-11 h-11 bg-gradient-to-br from-purple-300/30 to-indigo-300/30 rounded-full backdrop-blur-sm border border-white/30 animate-[pulse_2s_ease-in-out_infinite_1s]"></div>
        </div>

        {/* 3D Hexagon */}
        <div
          className="absolute top-[10%] left-[45%] w-32 h-32 animate-[float_12s_ease-in-out_infinite] hover:scale-125 transition-transform duration-500 cursor-pointer"
          style={{
            transform: `translate(${mousePos.x * 20}px, ${mousePos.y * -20}px)`,
          }}
        >
          <div className="relative w-full h-full animate-[spin_30s_linear_infinite_reverse] hover:animate-[spin_8s_linear_infinite_reverse]">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full drop-shadow-[0_0_20px_rgba(167,139,250,0.4)]"
            >
              <defs>
                <linearGradient
                  id="hexGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor="rgb(196, 181, 253)"
                    stopOpacity="0.3"
                  />
                  <stop
                    offset="100%"
                    stopColor="rgb(167, 139, 250)"
                    stopOpacity="0.3"
                  />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <polygon
                points="50,10 85,30 85,70 50,90 15,70 15,30"
                fill="url(#hexGradient)"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
                filter="url(#glow)"
              />
            </svg>
          </div>
        </div>

        {/* Floating Crystal */}
        <div
          className="absolute top-[80%] left-[10%] w-20 h-20 animate-[float_9s_ease-in-out_infinite] hover:scale-125 hover:rotate-12 transition-all duration-300 cursor-pointer"
          style={{
            transform: `translate(${mousePos.x * -25}px, ${
              mousePos.y * -15
            }px)`,
          }}
        >
          <div className="relative w-full h-full animate-[rotateY_14s_linear_infinite]">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-300/35 to-purple-400/35 rotate-45 backdrop-blur-md border border-white/40 shadow-[inset_0_0_15px_rgba(255,255,255,0.5),0_0_30px_rgba(99,102,241,0.3)]"></div>
            <div className="absolute inset-3 bg-gradient-to-br from-purple-300/25 to-pink-400/25 rotate-45"></div>
          </div>
        </div>

        {/* Bubble Constellation - Top Center */}
        <div
          className="absolute top-[25%] left-[70%] animate-[float_14s_ease-in-out_infinite] hover:scale-110 transition-transform duration-300 cursor-pointer"
          style={{
            transform: `translate(${mousePos.x * -30}px, ${mousePos.y * 10}px)`,
          }}
        >
          <div className="relative w-32 h-32">
            <div className="absolute top-0 left-0 w-12 h-12 bg-gradient-to-br from-pink-300/25 to-purple-300/25 rounded-full backdrop-blur-sm border border-white/30"></div>
            <div className="absolute top-8 right-0 w-10 h-10 bg-gradient-to-br from-purple-300/25 to-indigo-300/25 rounded-full backdrop-blur-sm border border-white/30"></div>
            <div className="absolute bottom-0 left-4 w-14 h-14 bg-gradient-to-br from-indigo-300/25 to-blue-300/25 rounded-full backdrop-blur-sm border border-white/30"></div>
            <div className="absolute top-12 left-10 w-8 h-8 bg-gradient-to-br from-blue-300/25 to-pink-300/25 rounded-full backdrop-blur-sm border border-white/30"></div>
          </div>
        </div>

        {/* Small floating bubbles scattered */}
        <div className="absolute top-[50%] right-[5%] w-6 h-6 bg-gradient-to-br from-purple-300/40 to-pink-300/40 rounded-full animate-[float_6s_ease-in-out_infinite] backdrop-blur-sm border border-white/30"></div>
        <div className="absolute top-[20%] left-[30%] w-5 h-5 bg-gradient-to-br from-indigo-300/40 to-purple-300/40 rounded-full animate-[float_7s_ease-in-out_infinite_reverse] backdrop-blur-sm border border-white/30"></div>
        <div className="absolute bottom-[30%] right-[45%] w-7 h-7 bg-gradient-to-br from-blue-300/40 to-indigo-300/40 rounded-full animate-[float_8s_ease-in-out_infinite] backdrop-blur-sm border border-white/30"></div>
        <div className="absolute top-[70%] left-[55%] w-4 h-4 bg-gradient-to-br from-pink-300/40 to-blue-300/40 rounded-full animate-[float_9s_ease-in-out_infinite_reverse] backdrop-blur-sm border border-white/30"></div>
        <div className="absolute bottom-[15%] left-[40%] w-8 h-8 bg-gradient-to-br from-purple-300/40 to-pink-300/40 rounded-full animate-[float_10s_ease-in-out_infinite] backdrop-blur-sm border border-white/30"></div>
        <div className="absolute top-[45%] right-[25%] w-5 h-5 bg-gradient-to-br from-indigo-300/40 to-blue-300/40 rounded-full animate-[float_11s_ease-in-out_infinite_reverse] backdrop-blur-sm border border-white/30"></div>

        {/* Micro bubbles for depth */}
        {microBubbles.map((bubble) => (
          <div
            key={bubble.id}
            className="absolute rounded-full backdrop-blur-sm border border-white/20 hover:scale-150 transition-transform duration-200 cursor-pointer"
            style={{
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              top: `${bubble.top}%`,
              left: `${bubble.left}%`,
              background: `linear-gradient(to bottom right, rgba(${bubble.r}, ${bubble.g}, 255, 0.25), rgba(${bubble.g}, ${bubble.r}, 255, 0.25))`,
              animation: `float ${bubble.duration}s ease-in-out infinite ${bubble.delay}s`,
              transform: `translate(${mousePos.x * (10 + (bubble.id % 5))}px, ${
                mousePos.y * (10 + (bubble.id % 5))
              }px)`,
            }}
          />
        ))}
      </div>

      {/* Keyframe animations */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) translateX(0px) scale(1);
          }
          33% {
            transform: translateY(-25px) translateX(10px) scale(1.05);
          }
          66% {
            transform: translateY(-15px) translateX(-10px) scale(0.95);
          }
        }

        @keyframes rotateY {
          0% {
            transform: rotateY(0deg) rotateX(10deg);
          }
          100% {
            transform: rotateY(360deg) rotateX(10deg);
          }
        }

        @keyframes rotateXY {
          0% {
            transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
          }
          100% {
            transform: rotateX(360deg) rotateY(360deg) rotateZ(360deg);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes morph {
          0%,
          100% {
            border-radius: 40% 60% 60% 40% / 60% 40% 60% 40%;
          }
          33% {
            border-radius: 60% 40% 40% 60% / 40% 60% 40% 60%;
          }
          66% {
            border-radius: 40% 60% 60% 40% / 40% 60% 60% 40%;
          }
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
        }

        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @keyframes starPulse {
          0%,
          100% {
            opacity: 0.6;
            transform: scale(1);
            filter: blur(0px);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
            filter: blur(1px);
          }
        }

        @keyframes shootingStar {
          0% {
            transform: translateX(-100px) translateY(-100px);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(100vw) translateY(100vh);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
