/**
 * Animation Utilities
 * Reusable animations with spring physics
 */

import { Animated, Easing } from 'react-native';

/**
 * Spring animation (bouncy, natural)
 */
export const spring = (
  value: Animated.Value,
  toValue: number,
  config?: Partial<Animated.SpringAnimationConfig>
) => {
  return Animated.spring(value, {
    toValue,
    useNativeDriver: true,
    friction: 7,
    tension: 40,
    ...config,
  });
};

/**
 * Timing animation (smooth, controlled)
 */
export const timing = (
  value: Animated.Value,
  toValue: number,
  duration: number = 300,
  easing: ((value: number) => number) = Easing.out(Easing.cubic)
) => {
  return Animated.timing(value, {
    toValue,
    duration,
    easing,
    useNativeDriver: true,
  });
};

/**
 * Fade in animation
 */
export const fadeIn = (value: Animated.Value, duration: number = 300) => {
  return timing(value, 1, duration, Easing.ease);
};

/**
 * Fade out animation
 */
export const fadeOut = (value: Animated.Value, duration: number = 300) => {
  return timing(value, 0, duration, Easing.ease);
};

/**
 * Scale up animation (bounce)
 */
export const scaleUp = (value: Animated.Value) => {
  return spring(value, 1, { friction: 5, tension: 100 });
};

/**
 * Scale down animation
 */
export const scaleDown = (value: Animated.Value) => {
  return spring(value, 0.95);
};

/**
 * Pulse animation (like button)
 */
export const pulse = (value: Animated.Value) => {
  return Animated.sequence([
    spring(value, 1.2, { friction: 3, tension: 200 }),
    spring(value, 1, { friction: 5, tension: 100 }),
  ]);
};

/**
 * Shake animation (error)
 */
export const shake = (value: Animated.Value) => {
  return Animated.sequence([
    timing(value, 10, 50),
    timing(value, -10, 50),
    timing(value, 10, 50),
    timing(value, 0, 50),
  ]);
};

/**
 * Slide in from right
 */
export const slideInRight = (value: Animated.Value, duration: number = 300) => {
  return timing(value, 0, duration, Easing.out(Easing.cubic));
};

/**
 * Slide out to right
 */
export const slideOutRight = (value: Animated.Value, duration: number = 300) => {
  return timing(value, 300, duration, Easing.in(Easing.cubic));
};

/**
 * Stagger animation (for lists)
 */
export const stagger = (animations: Animated.CompositeAnimation[], delay: number = 100) => {
  return Animated.stagger(delay, animations);
};

/**
 * Parallel animation (multiple at once)
 */
export const parallel = (animations: Animated.CompositeAnimation[]) => {
  return Animated.parallel(animations);
};
