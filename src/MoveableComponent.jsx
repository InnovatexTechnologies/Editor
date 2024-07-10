import React, { useRef, useEffect } from "react";
import Moveable from "moveable";

const MoveableComponent = () => {
  const targetRef = useRef(null);
  const moveableRef = useRef(null);

  useEffect(() => {
    moveableRef.current = new Moveable(document.body, {
      target: targetRef.current,
      container: document.body,
      draggable: true,
      resizable: true,
      scalable: true,
      rotatable: true,
      warpable: true,
      pinchable: true,
      origin: true,
      keepRatio: true,
      edge: false,
      throttleDrag: 0,
      throttleResize: 0,
      throttleScale: 0,
      throttleRotate: 0,
    });

    // Drag events
    moveableRef.current
      .on("dragStart", ({ target }) => {
        console.log("onDragStart", target);
      })
      .on("drag", ({ target, left, top }) => {
        console.log("onDrag", left, top);
        target.style.left = `${left}px`;
        target.style.top = `${top}px`;
      })
      .on("dragEnd", ({ target, isDrag }) => {
        console.log("onDragEnd", target, isDrag);
      });

    // Resize events
    moveableRef.current
      .on("resizeStart", ({ target }) => {
        console.log("onResizeStart", target);
      })
      .on("resize", ({ target, width, height }) => {
        console.log("onResize", width, height);
        target.style.width = `${width}px`;
        target.style.height = `${height}px`;
      })
      .on("resizeEnd", ({ target, isDrag }) => {
        console.log("onResizeEnd", target, isDrag);
      });

    // Scale events
    moveableRef.current
      .on("scaleStart", ({ target }) => {
        console.log("onScaleStart", target);
      })
      .on("scale", ({ target, transform }) => {
        console.log("onScale", transform);
        target.style.transform = transform;
      })
      .on("scaleEnd", ({ target, isDrag }) => {
        console.log("onScaleEnd", target, isDrag);
      });

    // Rotate events
    moveableRef.current
      .on("rotateStart", ({ target }) => {
        console.log("onRotateStart", target);
      })
      .on("rotate", ({ target, transform }) => {
        console.log("onRotate", transform);
        target.style.transform = transform;
      })
      .on("rotateEnd", ({ target, isDrag }) => {
        console.log("onRotateEnd", target, isDrag);
      });

    // Warp events
    moveableRef.current
      .on("warpStart", ({ target }) => {
        console.log("onWarpStart", target);
      })
      .on("warp", ({ target, transform }) => {
        console.log("onWarp", transform);
        target.style.transform = transform;
      })
      .on("warpEnd", ({ target, isDrag }) => {
        console.log("onWarpEnd", target, isDrag);
      });

    // Pinch events
    moveableRef.current
      .on("pinchStart", ({ target }) => {
        console.log("onPinchStart", target);
      })
      .on("pinch", ({ target }) => {
        console.log("onPinch", target);
      })
      .on("pinchEnd", ({ target, isDrag }) => {
        console.log("onPinchEnd", target, isDrag);
      });

    // Cleanup function
    return () => {
      moveableRef.current.destroy();
    };
  }, []);

  return (
    <div>
      <div
        ref={targetRef}
        className="target"
        style={{
          width: "100px",
          height: "100px",
          backgroundColor: "red",
          position: "absolute",
          left: "50px",
          top: "50px",
        }}
      >
        Drag me!
      </div>
    </div>
  );
};

export default MoveableComponent;
