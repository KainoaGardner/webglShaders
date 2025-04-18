import { SQUARE_VERTICES, TEXTURE_VERTICES } from "./geometry"
import { FRAGMENT_SHADER } from "./shaders/fragment"
import { VERTEX_SHADER } from "./shaders/vertex"
import { createStaticVertexBuffer, setRectangle } from "./utils"
import { vec2 } from "gl-matrix"

function main(image: HTMLImageElement) {
  const canvas: HTMLCanvasElement = document.getElementById("canvas") as HTMLCanvasElement;
  if (!canvas) {
    console.error("Could not get canvas reference");
    return
  }

  const gl = canvas.getContext("webgl2");

  if (!gl) {
    console.error("Could not get gl context")
    return
  }

  const mousePos = vec2.create();

  document.addEventListener("mousemove", function(event) {
    const rect = canvas.getBoundingClientRect()
    const mousePosX = event.clientX - rect.left;
    const mousePosY = canvas.height - event.clientY + rect.top;
    vec2.set(mousePos, mousePosX, mousePosY)
  });

  const squareVertexBuffer = createStaticVertexBuffer(gl, SQUARE_VERTICES);
  const texCoordBuffer = createStaticVertexBuffer(gl, TEXTURE_VERTICES);

  if (!squareVertexBuffer) {
    console.error("Could not make square static buffer")
    return;
  }

  if (!texCoordBuffer) {
    console.error("Could not make texture static buffer")
    return;
  }

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  if (!vertexShader) {
    console.error("Could not create vertex Shader")
    return;
  }
  gl.shaderSource(vertexShader, VERTEX_SHADER);
  gl.compileShader(vertexShader)

  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    const compileError = gl.getShaderInfoLog(vertexShader);
    console.error(compileError)
    return;
  }

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  if (!fragmentShader) {
    console.error("Could not create fragment Shader")
    return;
  }
  gl.shaderSource(fragmentShader, FRAGMENT_SHADER);
  gl.compileShader(fragmentShader)

  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    const compileError = gl.getShaderInfoLog(fragmentShader);
    console.error(compileError)
    return;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const linkError = gl.getProgramInfoLog(program)
    console.error(linkError)
    return;
  }

  const vertexPositionAttribLocation = gl.getAttribLocation(program, "aPosition");
  if (vertexPositionAttribLocation < 0) {
    console.error("Could not get position attribute location")
    return;
  }

  const texCoordAttribLocation = gl.getAttribLocation(program, "aTexCoord");
  if (texCoordAttribLocation < 0) {
    console.error("Could not get texcoord attribute location")
    return;
  }


  // const canvasSizeUniform = gl.getUniformLocation(program, "uResolution")
  // if (canvasSizeUniform === null) {
  //   console.error("Could not find canvas size uniform")
  //   return;
  // }

  // const timePassedUniform = gl.getUniformLocation(program, "uTime")
  // if (timePassedUniform === null) {
  //   console.error("Could not find start time uniform")
  //   return;
  // }

  // const mousePosUniform = gl.getUniformLocation(program, "uMouse")
  // if (mousePosUniform === null) {
  //   console.error("Could not find mouse pos uniform")
  //   return;
  // }

  const imageUniform = gl.getUniformLocation(program, "uImage")
  if (imageUniform === null) {
    console.error("Could not find image uniform")
    return;
  }

  const texture = gl.createTexture();
  if (!texture) {
    console.error("Cound not make texture")
    return
  }

  gl.activeTexture(gl.TEXTURE0 + 0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  const startTime = performance.now();
  const frame = function() {
    gl.viewport(0, 0, canvas.width, canvas.height)

    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.useProgram(program)

    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    gl.enableVertexAttribArray(vertexPositionAttribLocation)
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexBuffer)
    gl.vertexAttribPointer(vertexPositionAttribLocation, 2, gl.FLOAT, false, 0, 0)

    gl.enableVertexAttribArray(texCoordAttribLocation)
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
    gl.vertexAttribPointer(texCoordAttribLocation, 2, gl.FLOAT, false, 0, 0)


    // gl.uniform2f(canvasSizeUniform, canvas.width, canvas.height);

    // const currTime = performance.now();
    // const timePassed = (currTime - startTime) / 1000
    // gl.uniform1f(timePassedUniform, timePassed);

    // gl.uniform2f(mousePosUniform, mousePos[0], mousePos[1]);

    gl.uniform1i(imageUniform, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexBuffer)
    setRectangle(gl, 0, 0, image.width, image.height);

    gl.drawArrays(gl.TRIANGLES, 0, 6)

    requestAnimationFrame(frame)
  }

  requestAnimationFrame(frame)
}

const image = new Image();

image.src = "./public/images/wave.jpg";
image.onload = () => {
  main(image);
}
image.onerror = () => {
  console.error("could not load image")
};



