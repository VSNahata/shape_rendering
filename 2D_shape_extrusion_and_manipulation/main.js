import * as BABYLON from '@babylonjs/core';
import {editVertices, removeSpheres} from "./editVertex.js";

function initializeScene() {
  const canvas = document.getElementById('renderCanvas');
  const engine = new BABYLON.Engine(canvas);

  const createScene = function() {
      const scene = new BABYLON.Scene(engine);
      return scene;
  }

  const scene = createScene();

  const camera = new BABYLON.ArcRotateCamera("Camera", -3*Math.PI / 4, Math.PI / 4, 10, new BABYLON.Vector3(0, 0, 0), scene);
  camera.attachControl(canvas, true);

  var light = new BABYLON.DirectionalLight("light1", new BABYLON.Vector3(0, -10, 10), scene);
  light.intensity = 0.9;
  var light2 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 10, 10), scene);
  light2.intensity = 0.7;
  let ground = BABYLON.MeshBuilder.CreateGround("ground",{width:10, height:10}, scene);

  let groundMaterial = new BABYLON.StandardMaterial("groundMaterial");
  groundMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
  ground.material = groundMaterial;

  // will be attached when a mesh is selected
  let selectionMaterial = new BABYLON.StandardMaterial("selectionMaterial");
  selectionMaterial.diffuseColor = new BABYLON.Color3(0.3, 0, 0.3);

  // Drawing variables
  let isShapeDrawing = false;
  let drawingMode = false;
  let drawingPoints = [];
  let currentLine;
  let lines = [];
  let shape;
  let extrudedObjects = [];
  let selectedMesh;
  let moveMode = false;
  let vertexEdit = false;
  
  function updateDrawButtonState() {
    const drawButton = document.getElementById('drawButton');
    drawButton.disabled = isShapeDrawing; // Disable draw button when a shape is being drawn
    if (drawButton.disabled) {
      drawButton.classList.add('disabled-button');
  } else {
      drawButton.classList.remove('disabled-button');
  }
  }
  function updateExtrudeButtonState() {
    const extrudeButton = document.getElementById('extrudeButton');
    extrudeButton.disabled = drawingPoints.length < 3;
    if (extrudeButton.disabled) {
      extrudeButton.classList.add('disabled-button');
    } else {
      extrudeButton.classList.remove('disabled-button');
    }
  }
  function updateMoveButtonState(){
    const moveButton = document.getElementById('moveButton');
    moveButton.disabled = (isShapeDrawing || (!extrudedObjects.length))
    if (moveButton.disabled) {
      moveButton.classList.add('disabled-button');
    } else {
      moveButton.classList.remove('disabled-button');
    }
  }
  function updateVertexEditButtonState(){
    const vertexEditButton = document.getElementById('vertexEditButton')
    vertexEditButton.disabled = (isShapeDrawing || (!extrudedObjects.length)) 
    if (vertexEditButton.disabled) {
      vertexEditButton.classList.add('disabled-button');
    } else {
      vertexEditButton.classList.remove('disabled-button');
    }
  }
  function updateCancelLinesButtonState(){
    const cancelLinesButton = document.getElementById('cancelLines')
    cancelLinesButton.disabled = !isShapeDrawing || !lines.length
    if (cancelLinesButton.disabled) {
      cancelLinesButton.classList.add('disabled-button');
    } else {
      cancelLinesButton.classList.remove('disabled-button');
    }
  }
  function deleteAllLinesFromScene(){
    lines.forEach((line)=>{
      line.dispose();
    })
    lines = []
    drawingPoints = [];
  }
  // Draw button event
  document.getElementById('drawButton').addEventListener('click', () => {
      isShapeDrawing = true;
      drawingMode = true;
      moveMode = false;
      vertexEdit = false;
      updateDrawButtonState();
      updateMoveButtonState();
      updateVertexEditButtonState();
      removeSpheres(scene);
  });

  // Extrude button event
  document.getElementById('extrudeButton').addEventListener('click', () => {
      if (drawingPoints.length >= 3) {
        extrudeShape();
        isShapeDrawing = false; // Set to false when extrusion is completed
        moveMode = false;
        updateDrawButtonState();
        updateExtrudeButtonState();
        updateMoveButtonState();
        updateVertexEditButtonState();
        updateCancelLinesButtonState()
      }
  });

// Move button event
  document.getElementById('moveButton').addEventListener('click', () => {
      drawingMode = false;
      moveMode = true;
      vertexEdit = false;
      removeSpheres(scene);
  });

// Vertex Edit button event
  document.getElementById('vertexEditButton').addEventListener('click', () => {
      vertexEdit = true;
      drawingMode = false;
      moveMode = false;
      removeSpheres(scene);

  });
  document.getElementById('cancelLines').addEventListener('click', () => {
      isShapeDrawing = false
      drawingMode = false;
      moveMode = false;
      vertexEdit = false;
      removeSpheres(scene);
      updateDrawButtonState();
      updateMoveButtonState();
      updateVertexEditButtonState();
      deleteAllLinesFromScene();
      updateCancelLinesButtonState()

  });
updateVertexEditButtonState();
updateExtrudeButtonState();
updateMoveButtonState();
updateCancelLinesButtonState()

// Mouse events for left click (add points) and right click (complete shape)
canvas.addEventListener('click', handleMouseClick);
canvas.addEventListener('contextmenu', handleRightClick);

// Handle left click event
function handleMouseClick(event) {
  if (drawingMode && event.button === 0) { // Check if left click
      const pickResult = scene.pick(scene.pointerX, scene.pointerY);
      if (pickResult.hit) {
          const point = pickResult.pickedPoint;
          drawingPoints.push(new BABYLON.Vector3(point.x, 0.1, point.z));
          if (drawingPoints.length > 1) {
              currentLine = BABYLON.MeshBuilder.CreateLines('lines', { points: drawingPoints }, scene);
              lines.push(currentLine);
              updateCancelLinesButtonState()
          }

      }
  }
}

// Handle right click event to complete the shape
function handleRightClick(event) {
  // event.preventDefault(); // Prevent default right-click menu
  if (drawingMode) {
      if (drawingPoints.length >= 3) {
          // Check if the last point is close enough to the first point to close the shape
          const firstPoint = drawingPoints[0];
          const lastPoint = drawingPoints[drawingPoints.length - 1];
          const distance = BABYLON.Vector3.Distance(firstPoint, lastPoint);
          if (distance < 0.1) { // Adjust the threshold as needed
              drawingPoints.pop()
              drawingPoints.push(new BABYLON.Vector3(firstPoint.x, 0.1, firstPoint.z)); // Close the shape
              shape = BABYLON.MeshBuilder.CreatePolygon('shape', { shape: drawingPoints }, scene);
              shape.position.y = 0.1
              drawingMode = false;
              isShapeDrawing = false
              updateExtrudeButtonState(); // Update extrude button state
              updateCancelLinesButtonState()
          } else {
              alert("Shape not closed. Please close the shape by clicking near the starting point.");
          }
      } else {
              alert("Not enough points to close the shape. Please add more points.");
      }
  }
}

// Extrude the drawn shape
function extrudeShape() {
    const extrusionHeight = 1; // height can be hardcoded from here
    const extrudedObject = BABYLON.MeshBuilder.ExtrudePolygon('extrudedObject', { shape: drawingPoints, depth: extrusionHeight,updatable:true, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
    extrudedObject.position.y = extrusionHeight; // position is translated in y direction so that when shape is extruded the bottom of the object does not cross the ground.
    extrudedObject.bakeCurrentTransformIntoVertices();
    extrudedObjects.push(extrudedObject); // Store the extruded object in the array
    shape.dispose();
    deleteAllLinesFromScene();
    drawingMode = false;
    updateExtrudeButtonState();
}

// Edit vertices of the extruded objects
canvas.addEventListener('dblclick', event => {
    if (vertexEdit) {
        const pickResult = scene.pick(scene.pointerX, scene.pointerY);
        for (let i = 0; i < extrudedObjects.length; i++) {
            if (pickResult.hit && pickResult.pickedMesh === extrudedObjects[i]) {
                editVertices(extrudedObjects[i], scene);
                break; // Exit the loop once the mesh is found
            }
        }
    }
});
  
// Move the selected object
canvas.addEventListener('pointerdown', event => {
  if (moveMode) {
    const pickResult = scene.pick(scene.pointerX, scene.pointerY);
    if (pickResult.hit && pickResult.pickedMesh.name == "extrudedObject") {
          scene.activeCamera = camera
          scene.activeCamera.detachControl(canvas, true);
          selectedMesh = pickResult.pickedMesh;
          selectedMesh.material = selectionMaterial
      }
  }
});

canvas.addEventListener('pointermove', event => {
    if (moveMode && selectedMesh) {
      const pickResult = scene.pick(scene.pointerX, scene.pointerY, (mesh) => { return mesh === ground; });
        if (pickResult.hit) {
            const newPosition = pickResult.pickedPoint;
            selectedMesh.position.x = newPosition.x;
            selectedMesh.position.z = newPosition.z;

        }
    }
});
canvas.addEventListener('pointerup', event => {
  if (moveMode && selectedMesh) {
    scene.activeCamera.attachControl(canvas, true);
    selectedMesh.bakeCurrentTransformIntoVertices();
  }
    selectedMesh.material = null;
    selectedMesh = null;
});

engine.runRenderLoop(function() {
    scene.render();
});

  // this will resize the canvas in order to maintain proper rendering dimensions
  window.addEventListener('resize', function() {
      engine.resize();
  });
}

document.addEventListener('DOMContentLoaded', initializeScene);
