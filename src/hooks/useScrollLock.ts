import { useEffect } from "react";

export const useScrollLock = (isLocked: boolean) => {
  useEffect(() => {
    if (!isLocked) return;

    const currentCount = parseInt(document.body.dataset.scrollLock || "0", 10);
    document.body.dataset.scrollLock = (currentCount + 1).toString();
    document.body.style.overflow = "hidden";

    return () => {
      const newCount = Math.max(0, parseInt(document.body.dataset.scrollLock || "0", 10) - 1);
      document.body.dataset.scrollLock = newCount.toString();
      
      if (newCount === 0) {
        document.body.style.overflow = "unset";
      }
    };
  }, [isLocked]);
};
