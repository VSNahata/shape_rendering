# 2D Shape Extrusion and Manipulation
The objective of this task is to develop a Babylon.js application capable of enabling users to draw various 2D shapes directly onto the ground plane. These shapes can then be extruded into 3D objects with a predetermined height. Additionally, the application should offer functionalities for manipulating these objects, including moving them across the scene and editing their vertices. This interaction is facilitated through mode selection buttons provided in the user interface.
## Commands to run
- cd into 2D_shape_extrusion_and_manipulation
- npm i
- npm run start (assembled all the commands into this one command)
- npm run dev (to run the project)
It will run on port 5173.

## Implementation
- Before drawing click on draw button, then add points to the ground and when you want to close the polygon just put the last point close to the first point, then give a right click to complete the shape.
- Before drawing your next shape you have to extrude the shape with the extrude button being enabled.
- Then you can drag the 3d model by clicking on move button
- You can manipulate vertices by clicking on vertex edit button so that all the editable vertices will be shown and you can manipulate the mesh with mouse interactions.
