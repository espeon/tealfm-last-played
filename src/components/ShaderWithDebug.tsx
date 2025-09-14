import React from "react";
import MeshArtBackground from "./shader";
import { useDebugConfig } from "../hooks/useDebugConfig";
import { GrainOverlay } from "./grain";

interface ShaderWithDebugProps {
  // All props from MeshArtBackground except debug props (they come from the debug store)
  imageUrl?: string;
  imageUrlLight?: string;
  imageUrlDark?: string;
  blurRadius?: number;
  samples?: number;
  boxBlurRadius?: number;
  bokehSamples?: number;
  enableNavigationTransition?: boolean;
  transitionDuration?: number;
  backgroundOpacity?: number;
  removeBlur?: boolean;
  noFadeIn?: boolean;
  onLoadingStateChange?: (isLoading: boolean) => void;
  sceneManager?: any;
  containerRef?: React.RefObject<HTMLDivElement>;
}

/**
 * MeshArtBackground with automatic browser console debug support.
 *
 * Open browser dev console and use:
 * - shaderDebug.toggleBg()    - Show only background
 * - shaderDebug.toggleFg()    - Hide background, show moving layers
 * - shaderDebug.toggleBlur()  - Toggle blur effects
 * - shaderDebug.setLayers(3)  - Set layer count
 * - shaderDebug.reset()       - Reset to defaults
 * - shaderDebug.help()        - Show all commands
 */
export default function ShaderWithDebug(props: ShaderWithDebugProps) {
  const debugConfig = useDebugConfig();

  // Merge debug config with component props
  const mergedProps = {
    ...props,
    ...debugConfig,
    // removeBlur from debug overrides the prop
    removeBlur: debugConfig.removeBlur || props.removeBlur || false,
  };

  return (
    <>
      <GrainOverlay animate />
      <MeshArtBackground {...mergedProps} />
    </>
  );
}
