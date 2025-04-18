const VERTEX_SHADER = `#version 300 es
precision mediump float;

in vec2 aPosition;
in vec2 aTexCoord;

out vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord; 

  gl_Position = vec4(aPosition,0.0,1.0);
}`;

export { VERTEX_SHADER }

