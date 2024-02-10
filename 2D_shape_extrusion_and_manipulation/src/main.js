import * as BABYLON from "@babylonjs/core";
import { showVertices, removeSpheres } from "./vertexEdit.js";
/*
initializeScene Function:
- Initializes the Babylon.js scene with necessary components.
- Sets up event listeners for user interactions.
- Manages drawing, extrusion, vertex editing, and movement modes.
- Handles mouse events for shape creation, completion, and extrusion.
- Allows vertex editing and object movement based on user actions.
- Continuously renders the scene and resizes the canvas as needed.
*/
function initializeScene() {
  const canvas = document.getElementById("renderCanvas");
  const engine = new BABYLON.Engine(canvas);

  const createScene = function () {
    const scene = new BABYLON.Scene(engine);
    return scene;
  };

  const scene = createScene();

  const camera = new BABYLON.ArcRotateCamera(
    "Camera",
    (-3 * Math.PI) / 4,
    Math.PI / 4,
    10,
    new BABYLON.Vector3(0, 0, 0),
    scene,
  );
  camera.attachControl(canvas, true);

  var light = new BABYLON.DirectionalLight(
    "light1",
    new BABYLON.Vector3(0, -10, 10),
    scene,
  );
  light.intensity = 0.9;
  var light2 = new BABYLON.HemisphericLight(
    "light1",
    new BABYLON.Vector3(0, 10, 10),
    scene,
  );
  light2.intensity = 0.7;
  let ground = BABYLON.MeshBuilder.CreateGround(
    "ground",
    { width: 10, height: 10 },
    scene,
  );

  let groundMaterial = new BABYLON.StandardMaterial("groundMaterial");
  groundMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.7, 0);
  ground.material = groundMaterial;

  // will be attached when a mesh is selected
  let selectionMaterial = new BABYLON.StandardMaterial("selectionMaterial");
  selectionMaterial.diffuseColor = new BABYLON.Color3(0.3, 0, 0.39);

  // Drawing variables
  let drawingMode = false;
  let drawingPoints = [];
  let currentLine;
  let lines = [];
  let shape;
  let extrudedObjects = [];
  let selectedMesh;
  let moveMode = false;
  let vertexEdit = false;
  let lastMovePosition = null;

  //Updates the state of the draw button based on the current drawing mode.
  function updateDrawButtonState() {
    const drawButton = document.getElementById("drawButton");
    drawButton.disabled = drawingMode; // Disable draw button when a shape is being drawn
    if (drawButton.disabled) {
      drawButton.classList.add("disabled-button");
    } else {
      drawButton.classList.remove("disabled-button");
    }
  }
  //Updates the state of the extrude button based on the number of drawing points.
  function updateExtrudeButtonState() {
    const extrudeButton = document.getElementById("extrudeButton");
    extrudeButton.disabled = drawingPoints.length < 3;
    if (extrudeButton.disabled) {
      extrudeButton.classList.add("disabled-button");
    } else {
      extrudeButton.classList.remove("disabled-button");
    }
  }
  //Updates the state of the move button based on the current drawing and extruded objects.
  function updateMoveButtonState() {
    const moveButton = document.getElementById("moveButton");
    moveButton.disabled = drawingMode || !extrudedObjects.length;
    if (moveButton.disabled) {
      moveButton.classList.add("disabled-button");
    } else {
      moveButton.classList.remove("disabled-button");
    }
  }
  //Updates the state of the vertex edit button based on the current drawing and extruded objects.
  function updateVertexEditButtonState() {
    const vertexEditButton = document.getElementById("vertexEditButton");
    vertexEditButton.disabled = drawingMode || !extrudedObjects.length;
    if (vertexEditButton.disabled) {
      vertexEditButton.classList.add("disabled-button");
    } else {
      vertexEditButton.classList.remove("disabled-button");
    }
  }
  //Updates the state of the cancel lines button based on the current drawing mode and existing lines.
  function updateCancelLinesButtonState() {
    const cancelLinesButton = document.getElementById("cancelLines");
    cancelLinesButton.disabled = !drawingMode || !lines.length;
    if (cancelLinesButton.disabled) {
      cancelLinesButton.classList.add("disabled-button");
    } else {
      cancelLinesButton.classList.remove("disabled-button");
    }
  }
  //Deletes all lines from the scene and clears the drawing points array.
  function deleteAllLinesFromScene() {
    lines.forEach((line) => {
      line.dispose();
    });
    lines = [];
    drawingPoints = [];
  }
  // Draw button event
  document.getElementById("drawButton").addEventListener("click", () => {
    drawingMode = true;
    moveMode = false;
    vertexEdit = false;
    updateDrawButtonState();
    updateMoveButtonState();
    updateVertexEditButtonState();
    removeSpheres(scene);
  });

  // Extrude button event
  document.getElementById("extrudeButton").addEventListener("click", () => {
    if (drawingPoints.length >= 3) {
      extrudeShape();
      drawingMode = false;
      moveMode = false;
      updateDrawButtonState();
      updateExtrudeButtonState();
      updateMoveButtonState();
      updateVertexEditButtonState();
      updateCancelLinesButtonState();
    }
  });

  // Move button event
  document.getElementById("moveButton").addEventListener("click", () => {
    drawingMode = false;
    moveMode = true;
    vertexEdit = false;
    removeSpheres(scene);
    
  });

  // Vertex Edit button event
  document.getElementById("vertexEditButton").addEventListener("click", () => {
    vertexEdit = true;
    drawingMode = false;
    moveMode = false;
    removeSpheres(scene);
    showVertices(extrudedObjects, scene);
  });
  //CancelLines button event
  document.getElementById("cancelLines").addEventListener("click", () => {
    drawingMode = false;
    moveMode = false;
    vertexEdit = false;
    removeSpheres(scene);
    updateDrawButtonState();
    updateMoveButtonState();
    updateVertexEditButtonState();
    deleteAllLinesFromScene();
    updateCancelLinesButtonState();
  });
  updateVertexEditButtonState();
  updateExtrudeButtonState();
  updateMoveButtonState();
  updateCancelLinesButtonState();

  // Mouse events for left click (add points) and right click (complete shape)
  canvas.addEventListener("click", handleMouseClick);
  canvas.addEventListener("contextmenu", handleRightClick);

  //Handles left mouse click event for adding points during drawing mode.
  function handleMouseClick(event) {
    if (drawingMode && event.button === 0) {
      // Check if left click
      const pickResult = scene.pick(scene.pointerX, scene.pointerY);
      if (pickResult.hit) {
        const point = pickResult.pickedPoint;
        drawingPoints.push(new BABYLON.Vector3(point.x, 0.002, point.z)); // Intentionally it is lifted in the y-axis to have a clear shape
        if (drawingPoints.length > 1) {
          currentLine = BABYLON.MeshBuilder.CreateLines(
            "lines",
            { points: drawingPoints },
            scene,
          );
          lines.push(currentLine);
          updateCancelLinesButtonState();
        }
      }
    }
  }

  //Handles right mouse click event for completing the shape during drawing mode.
  function handleRightClick(event) {
    if (drawingMode) {
      if (drawingPoints.length >= 3) {
        // Check if the last point is close enough to the first point to close the shape
        const firstPoint = drawingPoints[0];
        const lastPoint = drawingPoints[drawingPoints.length - 1];
        const distance = BABYLON.Vector3.Distance(firstPoint, lastPoint);
        if (distance < 0.5) {
          // Adjust the threshold as needed
          drawingPoints.pop();
          drawingPoints.push(
            new BABYLON.Vector3(firstPoint.x, 0.002, firstPoint.z),
          ); // Close the shape
          shape = BABYLON.MeshBuilder.CreatePolygon(
            "shape",
            { shape: drawingPoints },
            scene,
          );
          shape.position.y = 0.002;
          drawingMode = false;
          updateExtrudeButtonState();
          updateCancelLinesButtonState();
        } else {
          alert(
            "Shape not closed. Please close the shape by clicking near the starting point.",
          );
        }
      } else {
        alert("Not enough points to close the shape. Please add more points.");
      }
    }
  }

  //Extrudes the drawn shape to create a 3D object
  function extrudeShape() {
    const extrusionHeight = 1; // height can be hardcoded from here
    const extrudedObject = BABYLON.MeshBuilder.ExtrudePolygon(
      "extrudedObject",
      {
        shape: drawingPoints,
        depth: extrusionHeight,
        updatable: true,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE,
      },
      scene,
    );
    extrudedObject.position.y = extrusionHeight; // position is translated in y direction so that when shape is extruded the bottom of the object does not cross the ground.
    extrudedObject.bakeCurrentTransformIntoVertices();
    extrudedObjects.push(extrudedObject); // Store the extruded object in the array
    shape.dispose();
    deleteAllLinesFromScene();
    drawingMode = false;
    updateExtrudeButtonState();
  }

  // Handles pointer down event for moving the selected object.
  canvas.addEventListener("pointerdown", (event) => {
    if (moveMode) {
      const pickResult = scene.pick(scene.pointerX, scene.pointerY);
      if (pickResult.hit && pickResult.pickedMesh.name == "extrudedObject") {
        //We detach control from the camera to prevent it from affecting the view orientation while we drag the mesh using pointermove.
        scene.activeCamera = camera;
        scene.activeCamera.detachControl(canvas, true);
        selectedMesh = pickResult.pickedMesh;
        selectedMesh.material = selectionMaterial;
        lastMovePosition = pickResult.pickedPoint;
      }
    }
  });
  //Handles pointer move event for moving the selected object and updates the position of the selected object based on pointer movement.
  canvas.addEventListener("pointermove", (event) => {
    if (moveMode && selectedMesh) {
      const pickResult = scene.pick(scene.pointerX, scene.pointerY);
      if (pickResult.hit) { //To not enable it to move away from the ground
        let movementVector = pickResult.pickedPoint.subtract(lastMovePosition)
        selectedMesh.position.x += movementVector.x;
        selectedMesh.position.z += movementVector.z;
        lastMovePosition = pickResult.pickedPoint;
      }
    }
  });
  //Handles pointer up event for moving the selected object.
  canvas.addEventListener("pointerup", (event) => {
    if (moveMode && selectedMesh) {
      //Attaching the control to camera once the mesh movement is complete.
      scene.activeCamera.attachControl(canvas, true);
      selectedMesh.bakeCurrentTransformIntoVertices();
      selectedMesh.material = null;
      selectedMesh = null;
    }
  });
  // changing the cursor style according to the mode selected.
  scene.registerBeforeRender(function () {
    if (drawingMode){
      document.body.style.cursor = "crosshair";
    } 
    else if (moveMode){
      document.body.style.cursor = "move";
    } 
    else if (vertexEdit){
      document.body.style.cursor = "pointer";
    } 
    else document.body.style.cursor = "default";
    vertexEditButton.style.borderColor = vertexEdit ? "crimson" : "";
    moveButton.style.borderColor = moveMode ? "crimson" : "";
    drawButton.style.borderColor = drawingMode ? "crimson" : "";
  });
  engine.runRenderLoop(function () {
    scene.render();
  });

  //This will resize the canvas in order to maintain proper rendering dimensions
  window.addEventListener("resize", function () {
    engine.resize();
  });
}

document.addEventListener("DOMContentLoaded", initializeScene);
/*
Code Overview:
- Scene Setup:
Initializes the Babylon.js engine and creates a scene.
Sets up a camera, lights, and ground mesh to provide a basic environment.

- UI Setup:
Defines HTML buttons for drawing, extruding, moving objects, and vertex editing.
Sets event listeners for button clicks to enable/disable corresponding modes.
- Drawing and Extrusion:
Allows users to draw polygons by clicking points on the canvas.
Supports closing the drawn shape and extruding it into a 3D object.

- Object Manipulation:
Enables users to move selected objects by clicking and dragging them.
Implements pointer event handlers for object movement and cursor management.

- Vertex Editing:
Provides functionality to edit vertices of extruded objects.
Displays vertices as spheres and allows users to interactively modify their positions.

- Rendering and Canvas Resizing:
Renders the scene continuously to provide real-time updates.
Resizes the canvas to maintain proper rendering dimensions when the window size changes.
---------------------------------------------------------------------------------------------
Algorithmic Walkthrough:

- Initialization:
Initialize the Babylon.js engine, create a scene, and set up the camera, lights, and ground mesh.

- UI Event Listeners:
Set event listeners for UI buttons (draw, extrude, move, vertex edit, cancel lines) to toggle corresponding modes and update button states.

- Drawing Mode:
Activate drawing mode when the user clicks the "Draw" button.
Allow users to click points on the canvas to draw a polygon shape.
Create lines between consecutive points to visualize the shape being drawn.
Handle right-click to close the shape if enough points are drawn.

- Extrusion:
Enable extrusion mode when the user clicks the "Extrude" button.
Extrude the drawn shape into a 3D object if it has enough points (>= 3).
Store the extruded object and clear drawing-related elements (lines, points) from the scene.

- Object Movement:
Activate move mode when the user clicks the "Move" button.
Allow users to select and drag objects (specifically named "extrudedObject") in the scene.
Detach control from the camera during dragging to prevent view orientation interference.

- Vertex Editing:
Enable vertex edit mode when the user clicks the "Vertex Edit" button.
Display vertices of extruded objects as spheres and allow users to interactively edit their positions.

- Rendering and Cursor Management:
Render the scene continuously to provide real-time updates.
Update cursor style based on the active mode (drawing, moving, vertex editing, default).

- Canvas Resizing:
Listen for window resize events and adjust the canvas size to maintain proper rendering dimensions.
*/
