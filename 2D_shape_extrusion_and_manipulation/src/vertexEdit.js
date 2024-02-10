let positions = [];
let draggableSpheres = [];
let meshVerticesSize = [];
let extrudedObjects = [];

export function showVertices(extrudedObjectsArray, scene) {
  // Clear existing data
  positions = [];
  extrudedObjects = extrudedObjectsArray;

  // if (vertexEdit) {
  // Clear existing draggable spheres before creating new ones
  removeSpheres(scene);
  draggableSpheres = [];

  for (let i = 0; i < extrudedObjects.length; i++) {
    let localMeshVertices = extrudedObjects[i].getVerticesData(
      BABYLON.VertexBuffer.PositionKind,
    );
    // Concatenate local mesh vertices to positions array
    positions.push(...localMeshVertices); // Using spread operator to merge arrays
    meshVerticesSize.push(localMeshVertices.length);
  }

  // Iterate over positions array and create draggable spheres
  for (let i = 0; i < positions.length; i += 3) {
    const vertexPosition = new BABYLON.Vector3(
      positions[i],
      positions[i + 1],
      positions[i + 2],
    );
    createDraggableSphere(vertexPosition, scene);
  }
  // }
}

function createDraggableSphere(vertexPosition, scene) {
  // Check if a sphere already exists at the vertex
  const existingSphereData = draggableSpheres.find((sphereData) =>
    sphereData.vertexPosition.equals(vertexPosition),
  );

  // If no sphere exists, create a new one
  if (!existingSphereData) {
    let sphereMaterial = new BABYLON.StandardMaterial("sphereMaterial", scene);
    sphereMaterial.diffuseColor = new BABYLON.Color3(1, 0.4, 0);

    const sphere = BABYLON.MeshBuilder.CreateSphere(
      "sphere",
      { diameter: 0.1 },
      scene,
    );
    sphere.material = sphereMaterial;
    sphere.position.copyFrom(vertexPosition);

    enableDragBehavior(sphere, vertexPosition, scene);

    // Store the sphere and its associated vertex position in the array
    draggableSpheres.push({ sphere, vertexPosition });
  }
}

function enableDragBehavior(sphere, vertexPosition, scene) {
  const dragBehavior = new BABYLON.PointerDragBehavior();
  dragBehavior.moveAttached = true;
  dragBehavior.attach(sphere);

  // Store the initial position of the sphere
  const initialPosition = vertexPosition.clone();

  // Update the mesh vertices when the sphere is dragged
  dragBehavior.onDragObservable.add((eventData) => {
    const newPosition = sphere.absolutePosition;
    const delta = newPosition.subtract(initialPosition);
    vertexPosition.addInPlace(delta); // Use addInPlace instead of add to modify the vector in-place

    // Update all vertices associated with this sphere
    updateVerticesAssociatedWithSphere(initialPosition, newPosition, scene);

    // Update the initial position for the next drag
    initialPosition.copyFrom(newPosition);
  });
}

function updateVerticesAssociatedWithSphere(oldPosition, newPosition, scene) {
  let cumsum = 0;
  for (let i = 0; i < extrudedObjects.length; i++) {
    let meshVertices = positions.slice(cumsum, cumsum + meshVerticesSize[i]);
    for (let j = 0; j < meshVertices.length; j += 3) {
      const vertexPosition = new BABYLON.Vector3(
        meshVertices[j],
        meshVertices[j + 1],
        meshVertices[j + 2],
      );
      if (vertexPosition.equals(oldPosition)) {
        vertexPosition.copyFrom(newPosition);
        // Update positions array with the new vertex position
        positions.splice(
          cumsum + j,
          3,
          newPosition.x,
          newPosition.y,
          newPosition.z,
        );
      }
    }
    extrudedObjects[i].updateVerticesData(
      BABYLON.VertexBuffer.PositionKind,
      meshVertices,
      scene,
    );
    cumsum += meshVerticesSize[i];
  }
}
export function removeSpheres(scene) {
    // to ensure all the spheres are removed
  let i = extrudedObjects.length + 3; //increasing in proportion to the no. of shapes
  while (i--) {
    scene.meshes.forEach((mesh) => {
      if (mesh.name == "sphere") {
        mesh.dispose();
      }
    });
  }
}
