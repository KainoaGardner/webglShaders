import { SQUARE_VERTICES } from "./geometry"
import { FRAGMENT_SHADER } from "./shaders/fragment"
import { VERTEX_SHADER } from "./shaders/vertex"
import { createStaticVertexBuffer } from "./utils"
import { vec2 } from "gl-matrix"

function main() {
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

  if (!squareVertexBuffer) {
    console.error("Could not make static buffer")
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

  const vertexPositionAttribLocation = gl.getAttribLocation(program, "vertexPosition");

  if (vertexPositionAttribLocation < 0) {
    console.error("Could not get attribute location")
    return;
  }

  const canvasSizeUniform = gl.getUniformLocation(program, "iResolution")
  if (canvasSizeUniform === null) {
    console.error("Could not find canvas size uniform")
    return;
  }

  const timePassedUniform = gl.getUniformLocation(program, "iTime")
  if (timePassedUniform === null) {
    console.error("Could not find start time uniform")
    return;
  }

  // const mousePosUniform = gl.getUniformLocation(program, "iMouse")
  // if (mousePosUniform === null) {
  //   console.error("Could not find mouse pos uniform")
  //   return;
  // }

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

    gl.uniform2f(canvasSizeUniform, canvas.width, canvas.height);

    const currTime = performance.now();
    const timePassed = (currTime - startTime) / 1000
    gl.uniform1f(timePassedUniform, timePassed);

    // gl.uniform2f(mousePosUniform, mousePos[0], mousePos[1]);

    gl.drawArrays(gl.TRIANGLES, 0, 6)

    requestAnimationFrame(frame)
  }

  requestAnimationFrame(frame)
}

main();
