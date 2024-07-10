import { useEffect, useReducer, useRef, useState } from "react";
import { MODES, PAN_LIMIT } from "../../utils/modes";

let lastPath = [];

const previewPen = (point, ctx) => {
  if (lastPath.length === 0) {
    ctx.beginPath();
    ctx.moveTo(point[0], point[1]);
  }
  ctx.lineTo(point[0], point[1]);
  ctx.stroke();
  lastPath.push(point);
};

// Draw Line Function
const drawLine = (path, ctx) => {
  if (path.length < 2) return;
  const [start, end] = path;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
};

const drawPen = (points, ctx) => {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (const p of points) {
    ctx.lineTo(p[0], p[1]);
  }
  ctx.stroke();
};

const prevent = (e) => {
  e.preventDefault();
  e.stopPropagation();
};

const modeButtons = [
  // {
  //   mode: MODES.PAN,
  //   title: "move",
  //   icon: "move.svg",
  // },
  {
    mode: MODES.PEN,
    title: "pen",
    icon: "pen.svg",
  },
  {
    mode: MODES.LINE,
    title: "line",
    icon: "line.svg",
  },
  {
    mode: MODES.RECT,
    title: "rectangle",
    icon: "rectangle.svg",
  },
  {
    mode: MODES.CIRCLE,
    title: "circle",
    icon: "circle.svg",
  },
];

const clearCanvas = (ctx) => {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, PAN_LIMIT, PAN_LIMIT);
  ctx.restore();
};

const Canvas = ({ settings, ...rest }) => {
  const width = Math.min(rest.width, PAN_LIMIT);
  const height = Math.min(rest.height, PAN_LIMIT);
  const [drawing, setDrawing] = useState(false);
  const [, render] = useReducer((prev) => !prev, false);

  const canvas = useRef(null);
  const context = useRef(null);
  const preview = useRef(null);
  const coords = useRef([0, 0]);
  const draw = useRef(false);
  const moving = useRef(false);
  const history = useRef([]);
  const redoHistory = useRef([]);
  const draggingLine = useRef(null); // Use useRef for draggingLine

  const changeColor = (e) => {
    settings.current.color = e.target.value;
  };

  const drawCanvas = (ctx) => {
    clearCanvas(ctx);
    for (const item of history.current) {
      getContext(item, ctx);
      drawModes(item.mode, ctx, null, item.path);
    }
  };

  const previewLine = (path, ctx) => {
    if (path.length < 2) return;
    ctx.beginPath();
    drawCanvas(ctx);
    drawLine(path, ctx);
  };

  const onPointerUp = (e) => {
    prevent(e);
    if (settings.current.mode === MODES.PAN) {
      moving.current = false;
      return;
    }
    setDrawing(false);
    draw.current = false;
    if (lastPath.length > 0) {
      history.current.push({
        ...settings.current,
        path: lastPath,
      });
      redoHistory.current = [];
      lastPath = [];
      drawCanvas(getContext());
    }

    if (draggingLine.current) {
      // Update history with the new path of the dragged line
      const index = history.current.findIndex(
        (item) => item === draggingLine.current
      );
      if (index !== -1) {
        history.current[index] = { ...draggingLine.current };
      }
      draggingLine.current = null;
      drawCanvas(getContext());
    }
  };

  const getPreviewActiveStyles = () => {
    const styles = {
      width: (width * 100) / PAN_LIMIT + "%",
      height: (height * 100) / PAN_LIMIT + "%",
    };
    if (!context.current) return styles;
    const { e, f } = getContext().getTransform();
    styles.left = (100 - e * 100) / PAN_LIMIT + "%";
    styles.top = (100 - f * 100) / PAN_LIMIT + "%";
    return styles;
  };

  const updatePreview = () => {
    if (preview.current) {
      const style = getPreviewActiveStyles();
      preview.current.style.left = style.left;
      preview.current.style.top = style.top;
    }
  };

  const onCanvasMove = (e, ctx) => {
    const [x1, y1] = coords.current;
    const { clientX: x2, clientY: y2 } = e;
    let dx = x2 - x1;
    let dy = y2 - y1;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    const { e: tdx, f: tdy } = ctx.getTransform();
    const ntdx = Math.min(Math.max(-(PAN_LIMIT - width), tdx + dx), 0);
    const ntdy = Math.min(Math.max(-(PAN_LIMIT - height), tdy + dy), 0);
    ctx.setTransform(1, 0, 0, 1, ntdx, ntdy);
    drawCanvas(ctx);
    coords.current = [x2, y2];
    updatePreview();
  };

  const onPointerMove = (e) => {
    prevent(e);
    if (moving.current) return onCanvasMove(e, context.current);
    if (draggingLine.current) return onDragLineMove(e);
    if (!draw.current) return;
    const point = getPoints(e, context.current);
    drawModes(settings.current.mode, context.current, point, lastPath);
  };

  const setMode = (mode) => () => {
    settings.current.mode = mode;
    render();
  };

  const getPoints = (e, ctx) => {
    if (ctx) {
      const { e: dx, f: dy } = ctx.getTransform();
      const rect = canvas.current.getBoundingClientRect();
      return [e.clientX - rect.x - dx, e.clientY - rect.y - dy];
    }
  };

  const getContext = (config, ctx) => {
    if (!context.current) {
      context.current = canvas.current.getContext("2d");
    }
    if (!ctx) ctx = context.current;
    if (config) {
      ctx.globalAlpha = config.alpha ?? 1;
      ctx.strokeStyle = config.stroke ?? "#000000";
      ctx.fillStyle = config.fill ?? "#000000";
      ctx.lineWidth = config.lineWidth ?? 1;
    }
    return ctx;
  };

  const drawModes = (mode, ctx, point, path) => {
    switch (mode) {
      case MODES.PEN:
        if (point) previewPen(point, ctx);
        else drawPen(path, ctx);
        break;
      case MODES.LINE:
        if (point) {
          // path.length === 0 ? (path[0] = point) : (path[1] = point);

          console.log("point", point);
          if (path.length === 0) {
            path[0] = point;
            path[1] = point;
          } else {
            path[1] = point;
          }

          previewLine(path, ctx);
        } else {
          drawLine(path, ctx);
        }
        break;
      case MODES.RECT:
        if (point) {
          path.length === 0 ? (path[0] = point) : (path[1] = point);
          // previewRect(path, ctx);
        } else {
          // drawRect(path, ctx);
        }
        break;
      case MODES.CIRCLE:
        // Your code for drawing circle
        break;
      default:
        break;
    }
  };

  const findLine = (point) => {
    for (const item of history.current) {
      if (item.mode !== MODES.PEN) continue;
      for (const p of item.path) {
        const [x, y] = p;
        if (Math.abs(x - point[0]) < 5 && Math.abs(y - point[1]) < 5) {
          return item;
        }
      }
    }
    return null;
  };

  const onPointerDown = (e) => {
    prevent(e);

    if (e.ctrlKey) {
      const point = getPoints(e, context.current);
      const line = findLine(point);
      if (line) {
        draggingLine.current = line;
        coords.current = point;
        return;
      }

      return;
    }

    getContext(settings.current);
    coords.current = [e.clientX, e.clientY];
    if (settings.current.mode === MODES.PAN) {
      moving.current = true;
      return;
    }
    setDrawing(true);
    draw.current = true;

    const point = getPoints(e, context.current);
    lastPath = [];
    drawModes(settings.current.mode, context.current, point, lastPath);
  };

  const onDragLineMove = (e) => {
    const point = getPoints(e, context.current);

    const [dx, dy] = [
      point[0] - coords.current[0],
      point[1] - coords.current[1],
    ];

    const updatedLine = draggingLine.current.path.map(([x, y]) => [
      x + dx,
      y + dy,
    ]);

    draggingLine.current.path = updatedLine;
    coords.current = point;
    drawCanvas(context.current);
  };

  useEffect(() => {
    const canvasEl = canvas.current;
    canvasEl.addEventListener("pointermove", onPointerMove);
    canvasEl.addEventListener("pointerup", onPointerUp);
    canvasEl.addEventListener("pointerdown", onPointerDown);

    const handleKeyUp = (e) => {
      if (e.key === "Control" && draggingLine.current) {
        draggingLine.current = null;
      }
    };

    window.addEventListener("keyup", handleKeyUp);

    return () => {
      canvasEl.removeEventListener("pointermove", onPointerMove);
      canvasEl.removeEventListener("pointerup", onPointerUp);
      canvasEl.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const undoCanvas = (e) => {
    prevent(e);
    if (history.current.length === 0) return;
    redoHistory.current.push(history.current.pop());
    drawCanvas(getContext());
    render();
  };

  const redoCanvas = (e) => {
    prevent(e);
    if (redoHistory.current.length === 0) return;
    history.current.push(redoHistory.current.pop());
    drawCanvas(getContext());
    render();
  };

  return (
    <>
      <canvas
        ref={canvas}
        width={width}
        height={height}
        onPointerDown={onPointerDown}
        className={settings.current.mode === MODES.PAN ? "moving" : "drawing"}
      />

      <div
        className="menu"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        // aria-disabled={drawing}
      >
        <div className="preview">
          <div
            className="active"
            ref={preview}
            style={getPreviewActiveStyles()}
          ></div>
        </div>
        <hr />
        <button className="button color" type="button">
          <input
            type="color"
            title="change color"
            defaultValue={settings.current.color}
            onChange={changeColor}
          />
        </button>
        <hr />
        {modeButtons.map((btn) => (
          <button
            className="button"
            key={btn.mode}
            type="button"
            onClick={setMode(btn.mode)}
            aria-pressed={settings.current.mode === btn.mode}
          >
            <img src={"assets/" + btn.icon} alt={btn.title} title={btn.title} />
          </button>
        ))}

        <hr />
        <button
          className="button"
          type="button"
          onClick={undoCanvas}
          disabled={history.current.length === 0}
        >
          <img src="assets/undo.svg" alt="undo" title="undo" />
        </button>
        <button
          className="button"
          type="button"
          onClick={redoCanvas}
          disabled={redoHistory.current.length === 0}
        >
          <img src="assets/redo.svg" alt="redo" title="redo" />
        </button>
      </div>
    </>
  );
};

export default Canvas;
