import { useState, useEffect } from "react";
import { shaderDebugStore } from "../utils/shaderDebug";

export function useDebugConfig() {
  const [config, setConfig] = useState(shaderDebugStore.getState());

  useEffect(() => {
    // Subscribe to debug store changes
    const unsubscribe = shaderDebugStore.subscribe(() => {
      setConfig(shaderDebugStore.getState());
    });

    return unsubscribe;
  }, []);

  return config;
}
