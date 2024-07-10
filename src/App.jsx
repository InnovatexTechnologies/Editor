import Canvas from "./components/Canvas/Canvas";
import "./App.css";
import { useRef } from "react";
import { MODES } from "./utils/modes";
import { useWindowSize } from "./utils/hooks";

function App() {
  const settings = useRef({
    stroke: 2,
    color: "#000",
    mode: MODES.PEN,
  });

  const size = useWindowSize();

  return (
    <div className="app">
      <div className="canvas-container">
        <Canvas {...size} settings={settings} />
      </div>
    </div>
  );
}

export default App;
