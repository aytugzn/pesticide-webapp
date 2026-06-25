/**
 * Recursively freezes an object and all of its nested properties.
 * Provides deep immutability for constants.
 * 
 * @param obj - The object to deep freeze
 * @returns The deep-frozen object
 */
export const deepFreeze = <T extends object>(obj: T): T => {
  const propNames = Reflect.ownKeys(obj);

  for (const name of propNames) {
    const value = obj[name as keyof T];

    if ((value && typeof value === "object") || typeof value === "function") {
      deepFreeze(value as object);
    }
  }

  return Object.freeze(obj);
};
