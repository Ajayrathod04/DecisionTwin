import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function initMagneticButtons(selector: string = '.btn-magnetic') {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => {
    const target = el as HTMLElement;
    const handleMove = (e: MouseEvent) => {
      const rect = target.getBoundingClientRect();
      const relX = e.clientX - rect.left - rect.width / 2;
      const relY = e.clientY - rect.top - rect.height / 2;
      gsap.to(target, {
        x: relX * 0.25,
        y: relY * 0.25,
        duration: 0.3,
        ease: 'power2.out',
      });
    };
    const handleLeave = () => {
      gsap.to(target, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.4)',
      });
    };
    target.addEventListener('mousemove', handleMove);
    target.addEventListener('mouseleave', handleLeave);
  });
}

export function animateNumber(
  element: HTMLElement | null,
  start: number,
  end: number,
  duration = 1,
  formatter?: (val: number) => string
) {
  if (!element) return;
  const obj = { val: start };
  gsap.to(obj, {
    val: end,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      if (element) {
        element.textContent = formatter ? formatter(obj.val) : Math.round(obj.val).toString();
      }
    },
  });
}

export { gsap, ScrollTrigger };
