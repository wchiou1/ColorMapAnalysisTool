//TODO Complete hitbox testing for receiverIcons, render receiverIcons
var canvas;
var gl;
var verticesBuffer;
var verticesColorBuffer;
var iconVBuffer;
var iconCBuffer;
var dragBuffer = [];
var receiverBuffers = [];
var iconViewBuffer = [];
//var verticesIndexBuffer;
var mvMatrix;
var shaderProgram;
var vertexPositionAttribute;
var vertexColorAttribute;
var perspectiveMatrix;

var mouseDown=false;
var lastMouseX;
var lastMouseY;


//Color stuffs
var colorMaps = [];//2d array of objects which stores the colors
var iconHeight = 50;
var iconWidth = 50;
var iconX = 600;
var iconY = 50;
var receiveX = 50;
var receiveY = 100;
var receiveDelta = 300;
var dragIcon=-1;
var mapCIndices = [0,1];
var setColorIndices = [];
var iconViewOffset = 0;
var iconViewWidth = 400;
var iconViewHeight = 70;


var image2DArray=[];
var imageWidth;
var imageHeight;
var orthogonal={
	l: 0,
	r: 1200,
	t: 600,
	b: 0
};



//
// start
//
// Called when the canvas is created to get the ball rolling.
//
function start() {

	  canvas = document.getElementById("glcanvas");

	  initWebGL(canvas);      // Initialize the GL context

	  // Only continue if WebGL is available and working
	  
	  //Declare hardset colors(temporary)
	  fakeColors();
	  
	  
	  
	  if (gl) {
	  
		canvas.onmousedown = handleMouseDown;
		document.onmouseup = handleMouseUp;
		document.onmousemove = handleMouseMove;
		gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
		gl.clearDepth(1.0);                 // Clear everything
		gl.enable(gl.DEPTH_TEST);           // Enable depth testing
		gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

		// Initialize the shaders; this is where all the lighting for the
		// vertices and so forth is established.

		initShaders();

		// Here's where we call the routine that builds all the objects
		// we'll be drawing.

		initBuffers();
		
		updateIconView();
		
		updateIcons();
		updatereceiveIcons();

		// Set up to draw the scene periodically.
		drawScene();
		// no need to update screen every 15ms
		//setInterval(drawScene, 15);
	  }
	
}

//
// initWebGL
//
// Initialize WebGL, returning the GL context or null if
// WebGL isn't available or could not be initialized.
//
function initWebGL() {
  gl = null;

  try {
    gl = canvas.getContext("experimental-webgl");
  }
  catch(e) {
  }

  // If we don't have a GL context, give up now

  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
}

//
// initBuffers
//
// Initialize the buffers we'll need.
//
function initBuffers() {

	iconViewBuffer[0] = gl.createBuffer();
	iconViewBuffer[1] = gl.createBuffer();
	//Create buffers for the receive icons
	for(var i=0;i<2;i++){
		receiverBuffers[i] = [gl.createBuffer(),gl.createBuffer()];
	}

	//Create a buffer for the dragged icon vertices
	dragBuffer[0] = gl.createBuffer();
	
	//Create a buffer for the dragged icon colors
	dragBuffer[1] = gl.createBuffer();

	//Create a buffer for the icons' vertices
	iconVBuffer = gl.createBuffer();
	
	//Create a buffer for the icons' colors
	iconCBuffer = gl.createBuffer();

  // Create a buffer for the cube's vertices.

  verticesBuffer = gl.createBuffer();

  // Now create an array of vertices 
	//each value on the image2DArray is represented with a square with 4 vertices
	createImageVertices();

  // Now set up the colors 
	verticesColorBuffer = gl.createBuffer();

	createImageColors();

  // Build the element array buffer; this specifies the indices
  // into the vertex array for each face's vertices.
  // -----not using this now --- this method will not display all the squares
  //just leaving this here for reference

  //verticesIndexBuffer = gl.createBuffer();
  //createImageVerticesIndex();
 
}

//Returns the index of the receiver at the coords or -1 if there is no receiver at location
function testreceiverHit(mouseX,mouseY){
	//Receivers will always be in the same x value
	if(mouseX<receiveX-iconWidth/2||mouseX>receiveX+iconWidth+iconWidth/2){
		return -1;
	}
	//Test y values
	for(var i=0;i<receiverBuffers.length;i++){
		if(mouseY>receiveY+i*receiveDelta-iconHeight/2&&mouseY<receiveY+iconHeight+i*receiveDelta+iconHeight/2){
			return i;
		}
	}
}

function testIconViewHit(mouseX,mouseY){
	if(mouseX>iconX&&mouseX<iconX+iconViewWidth){
		if(mouseY>iconY&&mouseY<iconY+iconViewHeight){
			return true;
		}
	}
	return false;
}

function updateIconView(){
	//Create the border around the view
	//Border will be 3 pixels thick
	var iconViewV = [];
	var iconViewC = [];
	
	iconViewV = iconViewV.concat([iconX-3,iconY-3,0]);
	iconViewV = iconViewV.concat([iconX+3+iconViewWidth,iconY-3,0]);
	iconViewV = iconViewV.concat([iconX+3+iconViewWidth,iconY+3+iconViewHeight,0]);
	iconViewV = iconViewV.concat([iconX-3,iconY+3+iconViewHeight,0]);
	
	iconViewV = iconViewV.concat([iconX,iconY,0]);
	iconViewV = iconViewV.concat([iconX+iconViewWidth,iconY,0]);
	iconViewV = iconViewV.concat([iconX+iconViewWidth,iconY+iconViewHeight,0]);
	iconViewV = iconViewV.concat([iconX,iconY+iconViewHeight,0]);
	
	for(var i=0;i<4;i++){
		iconViewC = iconViewC.concat([0.0,0.0,0.0,1.0]);
	}
	for(var i=0;i<4;i++){
		iconViewC = iconViewC.concat([0.5,0.5,0.5,1.0]);
	}
	
	gl.bindBuffer(gl.ARRAY_BUFFER, iconViewBuffer[0]);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(iconViewV), gl.STATIC_DRAW);
	iconViewBuffer[0].itemSize = 3;

	gl.bindBuffer(gl.ARRAY_BUFFER, iconViewBuffer[1]);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(iconViewC), gl.STATIC_DRAW);
	iconViewBuffer[1].itemSize = 4;
}

//Updates icons using mapCIndices(color map indices)
function updatereceiveIcons(){
	
	//Setup the icon to be rendered
	for(var i=0;i<2;i++){
		var iconVertices=[];
		var iconColors=[];
		for(var j=0;j<iconWidth;j++){
			var ix=receiveX+i+j;
			var iy=receiveY+i*receiveDelta;
			var tempColor=getColorHeight(mapCIndices[i],1.0*j/iconWidth);
			iconVertices = iconVertices.concat([ix,iy,0]);
			iconVertices = iconVertices.concat([ix+1,iy,0]);
			iconVertices = iconVertices.concat([ix+1,iy+iconHeight,0]);
			iconVertices = iconVertices.concat([ix,iy+iconHeight,0]);
			
			for(var k=0;k<4;k++){
				iconColors = iconColors.concat([tempColor.R/255.0,tempColor.G/255.0,tempColor.B/255.0,1.0]);
			}
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, receiverBuffers[i][0]);

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(iconVertices), gl.STATIC_DRAW);
		receiverBuffers[i][0].itemSize = 3;
	
		gl.bindBuffer(gl.ARRAY_BUFFER, receiverBuffers[i][1]);

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(iconColors), gl.STATIC_DRAW);
		receiverBuffers[i][1].itemSize = 4;
	}
}

//Returns which index of the color map the icon represents or -1 if no icon was hit
function testIconHit(mouseX,mouseY){
	//First test y value
	if(mouseY<iconY+10||mouseY>iconY+10+iconHeight){
		return -1;
	}
	//Test x values
	for(var i=0;i<colorMaps.length;i++){
		if(mouseX>iconX+10+i*(iconWidth+10)-iconViewOffset&&mouseX<iconX+10+iconWidth+i*(iconWidth+10)-iconViewOffset){
			return i;
		}
	}
	return -1;
}

//Gets the color at the specified "height" assuming first color in a map is 0.0 and last color is 1.0
function getColorHeight(cindex,height){
	if(height>=1.0||height<0.0){
		console.log("Warning: Attempted to get invalid color height("+height+").");
		return {'R' : 0,'G' : 0,'B' : 0};
	}
	var index=Math.floor(1.0*(colorMaps[cindex].length)*height);
	return colorMaps[cindex][index];
}

function updateDrag(mouseX,mouseY){
	//Checks if there is an icon which should be dragged
	if(dragIcon<0){
		return;
	}
	//Setup the icon to be rendered
	var iconVertices=[];
	var iconColors=[];
	for(var i=0;i<iconWidth;i++){
		var ix=mouseX+i-iconWidth/2;
		var tempColor=getColorHeight(dragIcon,1.0*i/iconWidth);
		iconVertices = iconVertices.concat([ix,mouseY-iconHeight/2,0]);
		iconVertices = iconVertices.concat([ix+1,mouseY-iconHeight/2,0]);
		iconVertices = iconVertices.concat([ix+1,mouseY+iconHeight/2,0]);
		iconVertices = iconVertices.concat([ix,mouseY+iconHeight/2,0]);
		
		for(var k=0;k<4;k++){
			iconColors = iconColors.concat([tempColor.R/255.0,tempColor.G/255.0,tempColor.B/255.0,1.0]);
		}
	}
	
	gl.bindBuffer(gl.ARRAY_BUFFER, dragBuffer[0]);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(iconVertices), gl.STATIC_DRAW);
	iconVBuffer.itemSize = 3;
	
	gl.bindBuffer(gl.ARRAY_BUFFER, dragBuffer[1]);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(iconColors), gl.STATIC_DRAW);
	iconCBuffer.itemSize = 4;
}

//Sets up the icons in a horizontal row starting at the coords given 
function updateIcons(){
	var iconVertices=[];
	var iconColors=[];
	for(var i=0;i<colorMaps.length;i++){
		for(var j=0;j<iconWidth;j++){
			var ix=iconX+i*(iconWidth+10)+j+10-iconViewOffset;
			var iy=iconY+10;
			var tempColor;
			if(ix<iconX||ix>iconX+iconViewWidth){
				tempColor={'R':.5,'G':.5,'B':.5};
				for(var k=0;k<4;k++){
					iconVertices = iconVertices.concat([0,0,0]);
				}
			}
			else{
				tempColor=getColorHeight(i,1.0*j/iconWidth);
				iconVertices = iconVertices.concat([ix,iy,0]);
				iconVertices = iconVertices.concat([ix+1,iy,0]);
				iconVertices = iconVertices.concat([ix+1,iy+iconHeight,0]);
				iconVertices = iconVertices.concat([ix,iy+iconHeight,0]);
			}
			
			for(var k=0;k<4;k++){
				iconColors = iconColors.concat([tempColor.R/255.0,tempColor.G/255.0,tempColor.B/255.0,1.0]);
			}
		}
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, iconVBuffer);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(iconVertices), gl.STATIC_DRAW);
	iconVBuffer.itemSize = 3;
	
	gl.bindBuffer(gl.ARRAY_BUFFER, iconCBuffer);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(iconColors), gl.STATIC_DRAW);
	iconCBuffer.itemSize = 4;
	
}

function getMousePos(canvas, evt) {
	var rect = canvas.getBoundingClientRect();
	return {
	  x: Math.round((evt.clientX-rect.left)/(rect.right-rect.left)*canvas.width),
	  y: Math.round((evt.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height)
	};
}

function handleMouseDown(event){
	if(mouseDown){
		return;
	}
	mouseDown=true;
	//Get the mouse x and y
	var mouse = getMousePos(canvas, event);
	//Test if the icon view box was hit
	if(testIconViewHit(mouse.x,mouse.y)){
		
		dragIcon=testIconHit(mouse.x,mouse.y);
		if(dragIcon==-1){
			dragIcon=-2;
		}
	}
	lastMouseX=mouse.x;
	lastMouseY=mouse.y;
}


//Called when the mouse is released
function handleMouseUp(event){
	var mouse = getMousePos(canvas, event);
	mouseDown = false;
	if(dragIcon>=0){
		var receiveIndex =  testreceiverHit(mouse.x,mouse.y);
		if(receiveIndex!=-1){
			mapCIndices[receiveIndex]=dragIcon;
			updatereceiveIcons();
		}
	};
	dragIcon=-1;
	drawScene();
}

//Called when the mouse moves
function handleMouseMove(event){
	if(!mouseDown){
		return;
	}
	
	var mouse = getMousePos(canvas, event);
	
	updateDrag(mouse.x,mouse.y);
	
	if(dragIcon==-2){
		updateIconViewOffset(mouse.x,mouse.y);
		updateIcons();
	}
	
	drawScene();
	lastMouseX=mouse.x;
	lastMouseY=mouse.y;
}

function updateIconViewOffset(mouseX,mouseY){
	var dx=lastMouseX-mouseX;
	iconViewOffset = iconViewOffset+dx;
	if(iconViewOffset<0||0>colorMaps.length*60-iconViewWidth){
		iconViewOffset=0;
	}
	if(0<colorMaps.length*60-iconViewWidth+10&&iconViewOffset>colorMaps.length*60-iconViewWidth+10){
		iconViewOffset=colorMaps.length*60-iconViewWidth+10;
	}
}

function fakeColors(){
//Create fake color maps for the icons
	colorMaps[0]=[{
				'R' : 255,
                'G' : 0,
				'B' : 0
				},{
				'R' : 0,
                'G' : 255,
				'B' : 0
				},{
				'R' : 0,
                'G' : 0,
				'B' : 255
				}];
			
	colorMaps[1]=[{
				'R' : 0,
                'G' : 255,
				'B' : 0
				},{
				'R' : 0,
                'G' : 0,
				'B' : 255
				}];
	colorMaps[2]=[{
				'R' : 0,
                'G' : 0,
				'B' : 255
				},{
				'R' : 255,
                'G' : 0,
				'B' : 0
				}];
	colorMaps[3]=[{
				'R' : 100,
                'G' : 200,
				'B' : 50
				},{
				'R' : 10,
                'G' : 25,
				'B' : 60
				},{
				'R' : 128,
                'G' : 128,
				'B' : 64
				}];
	colorMaps[4]=[{
				'R' : 0,
                'G' : 0,
				'B' : 255
				}];
	colorMaps[5]=[{
				'R' : 128,
                'G' : 0,
				'B' : 0
				}];
}

//
// drawScene
//
// Draw the scene.
//
function drawScene() {
  // Clear the canvas before we start drawing on it.
  gl.clearColor(.5, .5, .5, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  
  
  // Establish the perspective with which we want to view the
  // scene....
  // no not now ...perspectiveMatrix is a misnomer
  //it is actually orthogonal not perspective right now
  perspectiveMatrix = makeOrtho(orthogonal.l, orthogonal.r, orthogonal.t, orthogonal.b, 0.1, 100.0);
	
  // Set the drawing position to the "identity" point, which is
  // the center of the scene.

  loadIdentity();

  // Now move the drawing position a bit to where we want to start
  // drawing the square.
  mvTranslate([-0.0, 0.0, -6.0]);

  
	mvPushMatrix();
	//set position attribute of vertices
  gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  // Set the colors attribute for the vertices.

  gl.bindBuffer(gl.ARRAY_BUFFER, verticesColorBuffer);
  gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

  // Draw the squares
	
	//not drawing using indices right now
	//gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, verticesIndexBuffer);
	
	//pass in uniforms to shader
	setMatrixUniforms();
	
	//draw the squares one by one as two triangles
	
	//for(var i=0;i<imageWidth*imageHeight;i++){
		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	//}
	
	//Draw the border of the icon view
	gl.bindBuffer(gl.ARRAY_BUFFER, iconViewBuffer[0]);
	gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, iconViewBuffer[1]);
	gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
	
	setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	gl.drawArrays(gl.TRIANGLE_FAN, 4, 4);
	
	//Render the icons
	gl.bindBuffer(gl.ARRAY_BUFFER, iconVBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, iconCBuffer);
	gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
	
	setMatrixUniforms();
	for(var i=0;i<colorMaps.length*iconWidth;i++){
		gl.drawArrays(gl.TRIANGLE_FAN, i*4, 4);
	}
	
	//Draw receive icons
	for(var i=0;i<receiverBuffers.length;i++){
		gl.bindBuffer(gl.ARRAY_BUFFER, receiverBuffers[i][0]);
		gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	
		gl.bindBuffer(gl.ARRAY_BUFFER, receiverBuffers[i][1]);
		gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
	
		setMatrixUniforms();
		for(var j=0;j<iconWidth;j++){
			gl.drawArrays(gl.TRIANGLE_FAN, j*4, 4);
		}
	}
	
	//Draw the dragged icon(if there is one)
	if(dragIcon>=0){
		gl.bindBuffer(gl.ARRAY_BUFFER, dragBuffer[0]);
		gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	
		gl.bindBuffer(gl.ARRAY_BUFFER, dragBuffer[1]);
		gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
	
		setMatrixUniforms();
		for(var i=0;i<iconWidth;i++){
			gl.drawArrays(gl.TRIANGLE_FAN, i*4, 4);
		}
	
	}
	 mvPopMatrix();
}

//
// initShaders
//
// Initialize the shaders, so WebGL knows how to light our scene.
//
function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");

  // Create the shader program

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program: " + gl.getProgramInfoLog(shader));
  }

  gl.useProgram(shaderProgram);

  vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(vertexPositionAttribute);
  
  vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(vertexColorAttribute);
}

//
// getShader
//
// Loads a shader program by scouring the current document,
// looking for a script with the specified ID.
//
function getShader(gl, id) {
  var shaderScript = document.getElementById(id);

  // Didn't find an element with the specified ID; abort.

  if (!shaderScript) {
    return null;
  }

  // Walk through the source element's children, building the
  // shader source string.

  var theSource = "";
  var currentChild = shaderScript.firstChild;

  while(currentChild) {
    if (currentChild.nodeType == 3) {
      theSource += currentChild.textContent;
    }

    currentChild = currentChild.nextSibling;
  }

  // Now figure out what type of shader script we have,
  // based on its MIME type.

  var shader;

  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;  // Unknown shader type
  }

  // Send the source to the shader object

  gl.shaderSource(shader, theSource);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

function createImageVertices(){
	//total number of vertices = ImageWidth x imageHeight x 4
	//upper left of image at (0,imageHeight)
	//lower right of image at (imageWidth,0)
	var imageVertices=[];
	/*
	for(var i=imageHeight;i>0;i--){
		for(var j=0; j<imageWidth; j++){
		
			imageVertices.push(j);
			imageVertices.push(i);
			imageVertices.push(0);
			
			imageVertices.push(j+1);
			imageVertices.push(i);
			imageVertices.push(0);
			
			imageVertices.push(j+1);
			imageVertices.push(i-1);
			imageVertices.push(0);
			
			imageVertices.push(j);
			imageVertices.push(i-1);
			imageVertices.push(0);
			
		}
	}
	*/
	imageVertices=[ 
	    20.0, 20.0,  0.0,
		20.0, 50.0,  0.0,
		50.0, 50.0,  0.0,
		50.0, 20.0,  0.0]
	// Select the verticesBuffer as the one to apply vertex
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
	
	 // Now pass the list of vertices into WebGL to build the shape. We
  // do this by creating a Float32Array from the JavaScript array,
  // then use it to fill the current vertex buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(imageVertices), gl.STATIC_DRAW);
  verticesBuffer.itemSize = 3;
  verticesBuffer.numItems = 4;

}

function createImageColors(){
	//a color for each vertex
	var imageColors=[];
	/*
	for(var i=0;i<imageHeight;i++){
		for(var j=0; j<imageWidth; j++){
			var color=image2DArray[imageWidth*i+j];
			for(var k=0;k<4;k++){
				imageColors.push(color);
				imageColors.push(color);
				imageColors.push(color);
				imageColors.push(1);
			}
		}
	}
	*/
	for (var i=0; i < 4; i++) {
		imageColors = imageColors.concat([0.5, 0.5, 1.0, 1.0]);
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, verticesColorBuffer);
	
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(imageColors), gl.STATIC_DRAW);
	verticesColorBuffer.itemSize = 4;
	verticesColorBuffer.numItems = 4;
}

//not used for now
function createImageVerticesIndex(){
	var verticesIndex=[];
	//total imageWidth*imageHeight*2 triangles
	for(var i=0;i<imageWidth*imageHeight;i++){
		verticesIndex.push(4*i+0);
		verticesIndex.push(4*i+1);
		verticesIndex.push(4*i+2);
		
		verticesIndex.push(4*i+0);
		verticesIndex.push(4*i+2);
		verticesIndex.push(4*i+3);
	}
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, verticesIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(verticesIndex), gl.STATIC_DRAW);
}

//set the orthogonal view to view the entire image
function setView(){
	orthogonal.l=0;
	orthogonal.r=imageWidth;
	orthogonal.b=0;
	orthogonal.t=imageHeight;
}


//
// Matrix utility functions
//

function loadIdentity() {
  mvMatrix = Matrix.I(4);
}

function multMatrix(m) {
  mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v) {
  multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}
function mvScale(v){
	multMatrix(Matrix.Diagonal($V([v[0], v[1], v[2]])).ensure4x4());
}
var mvMatrixStack = [];
function mvPushMatrix(m) {
  if (m) {
    mvMatrixStack.push(m.dup());
    mvMatrix = m.dup();
  } else {
    mvMatrixStack.push(mvMatrix.dup());
  }
}

function mvPopMatrix() {
  if (!mvMatrixStack.length) {
    throw("Can't pop from an empty matrix stack.");
  }

  mvMatrix = mvMatrixStack.pop();
  return mvMatrix;
}

function mvRotate(angle, v) {
  var inRadians = angle * Math.PI / 180.0;

  var m = Matrix.Rotation(inRadians, $V([v[0], v[1], v[2]])).ensure4x4();
  multMatrix(m);
}

function setMatrixUniforms() {
  var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

  var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
}
//
//handle the drop event
//

$(document).on('load',dropInit());
function dropInit(){
if(window.FileReader) { 
  addEventHandler(window, 'load', function() {
    var status = document.getElementById('status');
    var drop   = document.getElementById('drop');
    var list   = document.getElementById('list');
  	
    function cancel(e) {
       e.preventDefault(); 
    }
	
    addEventHandler(drop, 'dragover', cancel);
    addEventHandler(drop, 'dragenter', cancel);
	addEventHandler(drop,'drop', function(e) {
		e = e || window.event;
		cancel(e);
        e.stopPropagation();
        
        var files = e.dataTransfer.files; // Array of all files
        for (var i=0, file; file=files[i]; i++) {
                var reader = new FileReader();
                reader.onload = function(e2) { // finished reading file data.
					image2DArray=[];
					imageHeight=undefined;
					imageWidth=undefined;
					//parse the data into the array
                    var lines=e2.target.result.split('\n');
					if(lines[lines.length-1]=="")lines.pop();
					imageHeight=lines.length;
					for(var i=0;i<lines.length;i++) {
						var values=lines[i].split(' ');
						if(values[values.length-1]=="\r")values.pop();
						if(!imageWidth){
							imageWidth = values.length;
						}else if(imageWidth!=values.length){
							alert('error reading the file. line:'+i+ ", num:"+values.length+", value=("+values[0]+")");
						}
						for(var j=0; j<values.length; j++){
							if(values[j]) image2DArray.push(Number(values[j]));
						}
					}

					
					//canvas.style.width=imageWidth+"px";
					//canvas.style.height=imageHeight+"px";
					createImageVertices();
					createImageColors();
					//createImageVerticesIndex();
					//setView();
					drawScene();
			
                }
                reader.readAsText(file); // start reading the file data.
			}
		}) 
  });
} else { 
  document.getElementById('status').innerHTML = 'Your browser does not support the HTML5 FileReader.';
}
}


function addEventHandler(obj, evt, handler) {
    if(obj.addEventListener) {
        // W3C method
        obj.addEventListener(evt, handler, false);
    } else if(obj.attachEvent) {
        // IE method.
        obj.attachEvent('on'+evt, handler);
    } else {
        // Old school method.
        obj['on'+evt] = handler;
    }
}

