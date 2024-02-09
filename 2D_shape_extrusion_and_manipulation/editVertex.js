// Function to edit vertices of the extruded object

let draggableSpheres = [];
export function editVertices(mesh, scene) {
    draggableSpheres = []
    removeSpheres(scene);
    removeSpheres(scene);
    removeSpheres(scene);
    removeSpheres(scene);

    const localMeshVertices = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    const localVertices = [];

    for (let i = 0; i < localMeshVertices.length; i += 3) {
        const vertexPosition = new BABYLON.Vector3(localMeshVertices[i], localMeshVertices[i + 1], localMeshVertices[i + 2]);
        createDraggableSphere(vertexPosition, localVertices, mesh, scene);
    }

    console.log('Selected mesh vertices:', localVertices);
}

// Function to create a draggable sphere at each vertex
function createDraggableSphere(vertexPosition, localVertices, mesh, scene) {
    console.log(`i was called`)
    // Check if a sphere already exists at the vertex
    const existingSphere = draggableSpheres.find(sphere => sphere.position.equals(vertexPosition));

    // If no sphere exists, create a new one
    if (!existingSphere) {
        let sphereMaterial = new BABYLON.StandardMaterial("sphereMaterial", scene);
        sphereMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);

        const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 0.1 }, scene);
        sphere.material = sphereMaterial;
        sphere.position.copyFrom(vertexPosition);

        enableDragBehavior(sphere, vertexPosition, localVertices, mesh, scene);

        // Store the sphere in the array
        draggableSpheres.push(sphere);
    }
}

// Function to enable drag behavior for the spheres
function enableDragBehavior(sphere, vertexPosition, localVertices, mesh,scene) {
  const dragBehavior = new BABYLON.PointerDragBehavior();
  dragBehavior.useObjectOrientationForDragging = false;
  dragBehavior.moveAttached = true;
  dragBehavior.attach(sphere);

  // Store the initial position of the sphere
  const initialPosition = vertexPosition.clone();

  // Update the mesh vertices when the sphere is dragged
  dragBehavior.onDragObservable.add(eventData => {
      const newPosition = sphere.absolutePosition;
      const delta = newPosition.subtract(initialPosition);
      vertexPosition.addInPlace(delta); // Update the position of the vertex

      // Update all vertices associated with this sphere
      updateVerticesAssociatedWithSphere(mesh, initialPosition, newPosition, scene);

      // Update the initial position for the next drag
      initialPosition.copyFrom(newPosition);
  });

  // Store the drag behavior for cleanup
  sphere.dragBehavior = dragBehavior;

  // Store the local vertices for later use
  localVertices.push({ sphere, vertexPosition });
}

// Function to update all vertices associated with the moved sphere
function updateVerticesAssociatedWithSphere(mesh, oldPosition, newPosition, scene) {
  const localMeshVertices = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
  const positions = [];

  for (let i = 0; i < localMeshVertices.length; i += 3) {
      const vertexPosition = new BABYLON.Vector3(localMeshVertices[i], localMeshVertices[i + 1], localMeshVertices[i + 2]);
      if (vertexPosition.equals(oldPosition)) {
          vertexPosition.copyFrom(newPosition);
      }
      positions.push(vertexPosition.x, vertexPosition.y, vertexPosition.z);
  }

  mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions,scene);
}

export function removeSpheres(scene) {
  let i = 4;
  while(i--){ // to ensure all the spheres are removed
      scene.meshes.forEach(mesh => {
          if (mesh.name == "sphere") {
              mesh.dispose();
          }
      });
  }
}