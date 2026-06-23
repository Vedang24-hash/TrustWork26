import { useInView } from 'react-intersection-observer'

/**
 * Custom hook for scroll-triggered animations
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Percentage of element visibility to trigger (0-1)
 * @param {boolean} options.triggerOnce - Whether animation should only trigger once
 * @param {number} options.delay - Delay before animation starts (ms)
 * @returns {Object} - ref to attach to element and inView state
 */
export function useScrollAnimation(options = {}) {
  const {
    threshold = 0.1,
    triggerOnce = true,
    delay = 0,
  } = options

  const { ref, inView } = useInView({
    threshold,
    triggerOnce,
    delay,
  })

  return { ref, inView }
}

/**
 * Hook for staggered animations (useful for lists/grids)
 * @param {number} index - Index of the item in the list
 * @param {number} staggerDelay - Delay between each item (ms)
 */
export function useStaggeredAnimation(index = 0, staggerDelay = 100) {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  })

  const style = {
    transitionDelay: inView ? `${index * staggerDelay}ms` : '0ms',
  }

  return { ref, inView, style }
}
