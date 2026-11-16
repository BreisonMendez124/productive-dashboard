/**
 * Carousel.jsx
 * 
 * Componente de carrusel — Rota automáticamente entre slides (diapositivas).
 * 
 * Funcionalidad:
 * - Cambia de slide cada N segundos (intervalo configurable)
 * - Muestra indicadores (dots) para navegación visual
 * - Renderiza el slide actual en pantalla completa
 * 
 * Props:
 * @param {ReactNode | ReactNode[]} children - Array de slides o componente único
 * @param {number | Array<number>} [intervalMs=20000] - Intervalo(s) en milisegundos:
 *   - Número único: todos los slides tienen el mismo intervalo
 *   - Array: cada posición corresponde a un slide [slide1Ms, slide2Ms, slide3Ms, ...]
 *   - Default: 20000ms (20s)
 * 
 * Ejemplos:
 *   // Todos los slides duran 20s
 *   <Carousel intervalMs={20000}>
 *     <Slide1 /> <Slide2 /> <Slide3 />
 *   </Carousel>
 * 
 *   // Intervalos diferentes: Slide 1 = 60s, Slide 2 = 30s, Slide 3 = 30s
 *   <Carousel intervalMs={[60000, 30000, 30000]}>
 *     <Slide1 /> <Slide2 /> <Slide3 />
 *   </Carousel>
 * 
 * Comportamiento:
 * - Al montar: crea interval que cambia el índice cada 20s
 * - Los dots indican cuál slide está activo
 * - Al desmontar: cancela el interval (cleanup)
 * - Si hay más slides que intervalos en array, usa el último intervalo
 */

import { useEffect, useRef, useMemo, useState } from "react";

export default function Carousel({ children, intervalMs = 20000 }) {
  /**
   * slides — Normaliza children a array
   * Si es un solo componente, lo envuelve en array
   * Si ya es array, lo deja como está
   */
  const slides = useMemo(
    () => (Array.isArray(children) ? children : [children]),
    [children]
  );

  /**
   * idx — Índice del slide actual (0, 1, 2, ...)
   */
  const [idx, setIdx] = useState(0);

  /**
   * timerRef — Referencia al timer acumulativo
   * Trackea cuántos milisegundos ha estado el slide actual
   */
  const timerRef = useRef(0);
 
  /**
   * getIntervalForSlide — Obtiene el intervalo para el slide actual
   * 
   * Si intervalMs es array: usa la posición del índice
   * Si es número: usa el mismo para todos
   * Si el índice > array.length: usa el último del array
   */
  const getIntervalForSlide = (slideIdx) => {
    if (Array.isArray(intervalMs)) {
      return intervalMs[Math.min(slideIdx, intervalMs.length - 1)];
    }
    return intervalMs;
  };

  /**
   * Efecto: Configura el interval de rotación
   * 
   * - Obtiene el intervalo del slide actual
   * - Cada intervalo: idx = (idx + 1) % slides.length
   * - Cleanup: clearInterval al desmontar o cambiar slides
   */
  useEffect(() => {
    const t = setInterval(() => {
      timerRef.current += 100;
      
      setIdx((currentIdx) => {
        const interval = getIntervalForSlide(currentIdx);
        
        // Si el timer alcanzó el intervalo del slide actual
        if (timerRef.current >= interval) {
          timerRef.current = 0; // Reset timer para el próximo slide
          return (currentIdx + 1) % slides.length;
        }
        
        // Si no, mantener el mismo slide
        return currentIdx;
      });
    }, 100); // Ejecutar cada 100ms
    
    return () => clearInterval(t);
  }, [slides.length, intervalMs]);

  return (
    <div className="carousel">
      {/* Slide actual (ocupa todo el espacio disponible) */}
      <div className="slide">
        {slides[idx]}
      </div>

      {/* Indicadores de página (dots) — abajo centrados */}
      <div className="dots">
        {slides.map((_, i) => (
          <span
            key={i}
            className={`dot ${i === idx ? "active" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
