// Browser console debug system for shader
// Usage: Open dev console and type `shaderDebug.toggleBg()` etc.

interface DebugState {
  debugMode: boolean;
  showOnlyForeground: boolean;
  showOnlyBackground: boolean;
  debugLayerCount: number;
  removeBlur: boolean;
  speedMultiplier: number;
}

class ShaderDebugStore {
  private state: DebugState = {
    debugMode: false,
    showOnlyForeground: false,
    showOnlyBackground: false,
    debugLayerCount: 5,
    removeBlur: false,
    speedMultiplier: 3.0,
  };

  private listeners: (() => void)[] = [];

  // Subscribe to state changes
  subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  // Notify all subscribers
  private notify() {
    this.listeners.forEach((callback) => callback());
  }

  // Get current state
  getState() {
    return { ...this.state };
  }

  // Set state and notify
  private setState(updates: Partial<DebugState>) {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  // Debug commands
  toggleBg() {
    const newValue = !this.state.showOnlyBackground;
    this.setState({
      debugMode: true,
      showOnlyBackground: newValue,
      showOnlyForeground: false,
    });
    console.log(
      `🎨 ${newValue ? "Showing ONLY background layer" : "Showing all layers"}`,
    );
    return this.state;
  }

  toggleFg() {
    const newValue = !this.state.showOnlyForeground;
    this.setState({
      debugMode: true,
      showOnlyForeground: newValue,
      showOnlyBackground: false,
    });
    console.log(
      `🎨 ${newValue ? "Showing ONLY foreground layers" : "Showing all layers"}`,
    );
    return this.state;
  }

  setLayers(count: number) {
    if (count < 1 || count > 10) {
      console.warn("❌ Layer count must be between 1 and 10");
      return this.state;
    }
    this.setState({ debugLayerCount: count });
    console.log(`🎨 Set layer count to ${count}`);
    return this.state;
  }

  toggleBlur() {
    const newValue = !this.state.removeBlur;
    this.setState({ removeBlur: newValue });
    console.log(`🎨 Blur ${newValue ? "DISABLED" : "ENABLED"}`);
    return this.state;
  }

  setSpeed(multiplier: number) {
    if (multiplier < 0.1 || multiplier > 10) {
      console.warn("❌ Speed multiplier must be between 0.1 and 10");
      return this.state;
    }
    this.setState({ speedMultiplier: multiplier });
    console.log(`🎨 Set speed multiplier to ${multiplier}x`);
    return this.state;
  }

  faster() {
    const newSpeed = Math.min(10, this.state.speedMultiplier * 1.5);
    return this.setSpeed(newSpeed);
  }

  slower() {
    const newSpeed = Math.max(0.1, this.state.speedMultiplier / 1.5);
    return this.setSpeed(newSpeed);
  }

  normalSpeed() {
    return this.setSpeed(3.0);
  }

  reset() {
    this.setState({
      debugMode: false,
      showOnlyForeground: false,
      showOnlyBackground: false,
      debugLayerCount: 5,
      removeBlur: false,
      speedMultiplier: 3.0,
    });
    console.log("🎨 Reset to default configuration (all layers visible)");
    return this.state;
  }

  toggleDebug() {
    const newValue = !this.state.debugMode;
    this.setState({
      debugMode: newValue,
      showOnlyBackground: newValue ? this.state.showOnlyBackground : false,
      showOnlyForeground: newValue ? this.state.showOnlyForeground : false,
    });
    console.log(`🎨 Debug mode ${newValue ? "ENABLED" : "DISABLED"}`);
    return this.state;
  }

  // Show current state
  status() {
    console.log("🎨 Current shader debug state:", this.state);
    return this.state;
  }

  // Show help
  help() {
    console.log(`
🎨 Shader Debug Console Commands

Available functions:
  shaderDebug.toggleBg()     - Toggle background layer only
  shaderDebug.toggleFg()     - Toggle foreground layers only
  shaderDebug.toggleBlur()   - Toggle blur effects
  shaderDebug.setLayers(N)   - Set number of layers (1-10)
  shaderDebug.setSpeed(N)    - Set speed multiplier (0.1-10)
  shaderDebug.faster()       - Speed up by 1.5x
  shaderDebug.slower()       - Slow down by 1.5x
  shaderDebug.normalSpeed()  - Reset to normal speed (1x)
  shaderDebug.reset()        - Reset to default (all layers visible)
  shaderDebug.toggleDebug()  - Toggle debug mode on/off
  shaderDebug.status()       - Show current state
  shaderDebug.help()         - Show this help

Examples:
  shaderDebug.toggleBg()     // Show only background
  shaderDebug.toggleFg()     // Hide background, show moving layers
  shaderDebug.setLayers(3)   // Show only 3 layers
  shaderDebug.toggleBlur()   // Disable blur for performance
  shaderDebug.setSpeed(2)    // Double speed
  shaderDebug.faster()       // Speed up
  shaderDebug.slower()       // Slow down
  shaderDebug.reset()        // Back to normal

Current state:
${JSON.stringify(this.state, null, 2)}
    `);
    return this.state;
  }
}

// Create global instance
export const shaderDebugStore = new ShaderDebugStore();

// Add to global window object for console access
declare global {
  interface Window {
    shaderDebug: ShaderDebugStore;
  }
}

// Make it available globally
if (typeof window !== "undefined") {
  window.shaderDebug = shaderDebugStore;
  console.log(
    '🎨 Shader debug console loaded! Type "shaderDebug.help()" for commands',
  );
}
