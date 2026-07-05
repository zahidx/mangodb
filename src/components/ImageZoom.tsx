"use client";

import React, { useCallback, useRef, useState } from "react";

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
  /** Magnification factor. Default: 2.5 */
  zoom?: number;
  /** Lens size in px. Default: 120 */
  lensSize?: number;
}

export default function ImageZoom({
  src,
  alt,
  className = "",
  zoom = 2.5,
  lensSize = 120,
}: ImageZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLens, setShowLens] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [bgPos, setBgPos] = useState({ x: 0, y: 0 });

  const handleMouseEnter = useCallback(() => setShowLens(true), []);
  const handleMouseLeave = useCallback(() => setShowLens(false), []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Cursor position relative to the container (in %)
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // Clamp so the lens doesn't go off the edge
      const halfLensPct = (lensSize / rect.width / 2) * 100;
      const clampedX = Math.min(100 - halfLensPct * 2, Math.max(0, x - halfLensPct * 2));
      const clampedY = Math.min(100 - halfLensPct * 2, Math.max(0, y - halfLensPct * 2));

      // Lens position (offset so cursor is at center)
      setLensPos({
        x: e.clientX - rect.left - lensSize / 2,
        y: e.clientY - rect.top - lensSize / 2,
      });

      // Background position for the zoomed image (inverse of cursor position)
      setBgPos({
        x: -(clampedX * zoom),
        y: -(clampedY * zoom),
      });
    },
    [lensSize, zoom]
  );

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden cursor-crosshair ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {/* Main image */}
      <img src={src} alt={alt} className="w-full h-full object-cover pointer-events-none" />

      {/* Zoom lens */}
      {showLens && (
        <div
          className="absolute pointer-events-none border-2 border-white/80 shadow-xl rounded-full"
          style={{
            width: lensSize,
            height: lensSize,
            left: lensPos.x,
            top: lensPos.y,
            backgroundImage: `url(${src})`,
            backgroundSize: `${zoom * 100}%`,
            backgroundPosition: `${bgPos.x}px ${bgPos.y}px`,
            backgroundRepeat: "no-repeat",
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
}
