const FRAGMENT_SHADER = `#version 300 es
precision mediump float;

out vec4 outputColor;
uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float iTime;

const int maxIterations=3;

// vec2 rot(vec2 uv,float a){
// 	return vec2(uv.x*cos(a)-uv.y*sin(a),uv.y*cos(a)+uv.x*sin(a));
// }

vec2 rotateCenter(vec2 uv,float a){
  uv -= 0.5;
  mat2 rotMat = mat2(cos(a),-sin(a),sin(a),cos(a));
  uv *= rotMat;
  uv += 0.5;
  return uv;
}

void main(){
  vec2 uv = gl_FragCoord.xy / iResolution;

  uv = rotateCenter(uv,iTime);
  vec3 color = vec3(0.0);

  float result = 0.0;
  for (int i = 0;i < maxIterations;i++){
    uv = fract(uv);
    vec2 hole = step(1.0 / 3.0,uv) - step(2.0 / 3.0,uv);
    result = hole.x * hole.y;
    if (result == 1.0){
      break;
    }
    uv *= 3.0;
  }

  color = vec3(result);
	outputColor = vec4(color,1.0);
}`

const FRACTAL_FIRST_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

out vec4 outputColor;
uniform vec2 canvasSize;
uniform vec2 mousePosition;
uniform float timePassed;

const int maxIterations=6;//a nice value for fullscreen is 8

float circleSize=1.0/(3.0*pow(2.0,float(maxIterations)));

vec2 rot(vec2 uv,float a){
	return vec2(uv.x*cos(a)-uv.y*sin(a),uv.y*cos(a)+uv.x*sin(a));
}

void main(){
	//normalize stuff
  vec2 position = gl_FragCoord.xy / canvasSize;
  position = position * 2.0 - 1.0;
  position *= 0.5;

  vec3 color = vec3(0.0);

	// position=rot(position,timePassed);
	position*=sin(timePassed) * 0.5 + 1.5;
	
	float s=0.3;
	for(int i=0;i<maxIterations;i++){
		position = abs(position) - s;
		position = rot(position,timePassed);
		s=s/2.1;
	}
	
  float c = step(length(position),circleSize);
  color = vec3(c);

	outputColor = vec4(color,1.0);
}`

const FOG_FRACTAL_NOISE_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

out vec4 outputColor;
uniform vec2 canvasSize;
uniform vec2 mousePosition;
uniform float timePassed;

#define PI 3.14159265358979323846

float random (in vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233)))* 43758.5453123); 
}

float noise (in vec2 position){
  vec2 iPos = floor(position);
  vec2 fPos = fract(position);

  float a = random(iPos);
  float b = random(iPos + vec2(1.0,0.0));
  float c = random(iPos + vec2(0.0,1.0));
  float d = random(iPos + vec2(1.0,1.0));

  vec2 u = fPos * fPos * (3.0 - 2.0 * fPos);

  float ab = mix(a,b,u.x);
  float cd = mix(c,d,u.x);
  return mix(ab,cd,u.y);
}

#define OCTAVES 20
float fbm (in vec2 position){
  float value = 0.0;
  float lacunarity = 2.0;
  float gain = 0.65;
  
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < OCTAVES; i++){
    value += amplitude * abs(noise(frequency * position));
    position *= lacunarity;
    amplitude *= gain;
  }

  return value;
}

void main() {
  vec2 position = gl_FragCoord.xy / canvasSize;
  vec3 color = vec3(0.0);
  
  position += timePassed * vec2(0.2,0.0);

  color += fbm(position * 5.0);
  outputColor = vec4(color, 1.0);
} `


const COLOR_CHANGE_CELL_NOISE_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

out vec4 outputColor;
uniform vec2 canvasSize;
uniform vec2 mousePosition;
uniform float timePassed;

#define PI 3.14159265358979323846

vec2 random2( vec2 p ) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

void main() {
  vec2 position = gl_FragCoord.xy / canvasSize;
  vec3 color = vec3(0.0);

  vec2 points[5];
  points[0] = vec2(0.83,0.75);
  points[1] = vec2(0.60,0.07);
  points[2] = vec2(0.28,0.64);
  points[3] =  vec2(0.31,0.26);
  points[4] =  mousePosition / canvasSize;

  float minDist = 1.0;
  vec2 minPoint; 
  for (int i = 0;i < 5;i++){
    float dist = distance(position,points[i]);
    if (dist < minDist){
      minDist = dist;
      minPoint = points[i];
    }
  }

  color += minDist * 2.0;
  color.rg += minPoint;
  color -= abs(sin(100.0 * minDist)) * 0.1;
  color += 1.0 - step(0.01,minDist);

  outputColor = vec4(color, 1.0);
} `

const BLOOD_CELL_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

out vec4 outputColor;
uniform vec2 canvasSize;
uniform vec2 mousePosition;
uniform float timePassed;

#define PI 3.14159265358979323846

vec2 random2( vec2 p ) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

void main() {
  vec2 position = gl_FragCoord.xy / canvasSize;
  vec3 color = vec3(0.5,0.0,0.0);
  float size = 3.0;

  position *= size;

  vec2 iPos = floor(position);
  vec2 fPos = fract(position);

  float minDist = 1.0;

  for (int y = -1;y <= 1;y++){
    for (int x = -1;x <= 1;x++){
      vec2 neighbor = vec2(float(x),float(y));
      vec2 point = random2(iPos + neighbor);
      point = 0.5 + 0.5 * sin(timePassed + 5.8123 * point);

      float dist = distance(fPos,point + neighbor);
      minDist = min(minDist,dist);
    }
  }

  vec2 mousePos = mousePosition / canvasSize * size;
  float dist = distance(position,mousePos);
  minDist = min(minDist,dist);

  color += minDist;
  color.r += 1.0 - step(0.02,minDist);

  // color.r += step(0.99,fPos.x) + step(0.99,fPos.y);
  outputColor = vec4(color, 1.0);
} `


const CELLULAR_NOISE_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

out vec4 outputColor;
uniform vec2 canvasSize;
uniform vec2 mousePosition;
uniform float timePassed;

#define PI 3.14159265358979323846

void main() {
  vec2 position = gl_FragCoord.xy / canvasSize;
  vec3 color = vec3(0.0);

  vec2 points[5];
  points[0] = vec2(0.83,0.75);
  points[1] = vec2(0.60,0.07);
  points[2] = vec2(0.28,0.64);
  points[3] =  vec2(0.31,0.26);
  points[4] =  mousePosition / canvasSize;

  float minDist = 1.0;
  for (int i = 0;i < 5; i++){
    float dist = distance(position,points[i]);
    minDist = min(minDist,dist);
  }

  color += vec3(minDist);
  color -= step(0.6,abs(sin(100.0 * minDist)));
  
  outputColor = vec4(color, 1.0);
} `

const NOISE_CIRCLE_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

out vec4 outputColor;
uniform vec2 canvasSize;
uniform vec2 mousePosition;
uniform float timePassed;

#define PI 3.14159265358979323846

float random(float x){
  return fract(sin(x)*1e4);
}

float random(vec2 position){
  vec2 multvec = vec2(12.9898,78.233);
  float multfloat = 43758.5453123 ;
  return fract(sin(dot(position.xy,multvec)) * multfloat);
}

float noise (in vec2 position){
  vec2 iPos = floor(position);
  vec2 fPos = fract(position);

  float a = random(iPos);
  float b = random(iPos + vec2(1.0,0.0));
  float c = random(iPos + vec2(0.0,1.0));
  float d = random(iPos + vec2(1.0,1.0));

  vec2 u = fPos * fPos * (3.0 - 2.0 * fPos);
  
  float ab = mix(a,b,u.x);
  float cd = mix(c,d,u.x);
  return mix(ab,cd,u.y);
}

float circle(vec2 position,float radius,float strength,float time){
  float distance = distance(position,vec2(0.5));
  float distancePast = max(distance - radius,1e-5) * strength;
  float noise = noise((position + vec2(time)) * 10.0);
  float fadeOut = 1.0 - smoothstep(radius,radius + 0.3,distance);

  noise = noise / distancePast * fadeOut;
  
  float circleIn = step(distance,radius);
  float result = circleIn + noise;

  return result;
}

void main() {
  vec2 position = gl_FragCoord.xy / canvasSize;
  vec3 color = vec3(0.0);
  
  float size = 10.0;
  
  float speed = 0.5;
  float baseTime = timePassed * speed;
  float iTime = floor(baseTime);
  float fTime = fract(baseTime);

  float noise1 = circle(position,0.3,10.0,iTime);
  float noise2 = circle(position,0.3,10.0,iTime + 1.0);

  color = vec3(mix(noise1,noise2,fTime));
  outputColor = vec4(color, 1.0);
} `

const NOISE_2D_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

out vec4 outputColor;
uniform vec2 canvasSize;
uniform vec2 mousePosition;
uniform float timePassed;

#define PI 3.14159265358979323846


float random(float x){
  return fract(sin(x)*1e4);
}

float random(vec2 position,float time){
  vec2 multvec = vec2(12.9898,78.233);
  float multfloat = 43758.5453123 + time;
  return fract(sin(dot(position.xy,multvec)) * multfloat);
}


float noise (in vec2 position,float time){
  vec2 iPos = floor(position);
  vec2 fPos = fract(position);

  float a = random(iPos,time);
  float b = random(iPos + vec2(1.0,0.0),time);
  float c = random(iPos + vec2(0.0,1.0),time);
  float d = random(iPos + vec2(1.0,1.0),time);

  vec2 u = fPos * fPos * (3.0 - 2.0 * fPos);
  
  float ab = mix(a,b,u.x);
  float cd = mix(c,d,u.x);
  return mix(ab,cd,u.y);
}


void main() {
  vec2 position = gl_FragCoord.xy / canvasSize;
  vec3 color = vec3(0.0);
  
  float size = 10.0;
  vec2 pos = (position) * size;

  color = vec3(noise(pos,timePassed));
  outputColor = vec4(color, 1.0);
} `

const NOISE_1D_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

out vec4 outputColor;

uniform vec2 canvasSize;
uniform vec2 mousePosition;
uniform float timePassed;

#define PI 3.14159265358979323846

float circle(vec2 position,float radius,float speed){
  float distance = distance(position,vec2(0.5) + vec2(speed,0.0)); 
  return step(distance,radius);
}

float random(float x){
  return fract(sin(x)*1e4);
}

float random(vec2 position){
  vec2 multvec = vec2(12.9898,78.233);
  float multfloat = 43758.5453123;
  return fract(sin(dot(position.xy,multvec)) * multfloat);
}

void main() {
  vec2 position = gl_FragCoord.xy / canvasSize;
  vec3 color = vec3(position.x);

  float speed = timePassed * 1.0;

  vec2 grid1 = position * vec2(1.0,1.0);
  grid1.x += speed;
  float iPos = floor(grid1.x);
  float fPos = fract(grid1.x);
  float yOffset = mix(random(iPos),random(iPos + 1.0),smoothstep(0.0,1.0,fPos)) - 0.5;
  grid1.y += yOffset;
  float size = 0.5;

  color = vec3(circle(grid1,size,speed));
  outputColor = vec4(color, 1.0);
} `

const RANDOM_MOVE_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

out vec4 outputColor;

uniform vec2 canvasSize;
uniform vec2 mousePosition;
uniform float timePassed;

#define PI 3.14159265358979323846

float random (vec2 position){
  vec2 multVec = vec2(12.9898,78.233);
  float multFloat = 43758.5453123;
  return fract(sin(dot(position.xy,multVec)) * multFloat);
}

float random (float x){
  return fract(sin(x)*1e4);
}

float getColor(float color,float amount){
  return step(amount,color);
}

float getDirection(float y){
  y = step(0.5,random(y));
  return y * 2.0 - 1.0;
}

void main() {
  vec2 position = gl_FragCoord.xy / canvasSize;
  float speed = mousePosition.y / canvasSize.y * 50.0;
  vec3 backColor = vec3(0.0);

  vec2 gridSize = vec2(25.0,25.0);
  vec2 grid1 = position * gridSize;
  vec2 iPos = floor(grid1);
  vec2 fPos = fract(grid1);

  float direction = getDirection(iPos.y + 1.0);
  grid1 += vec2(1.0,0.0) * timePassed * speed * random(iPos.y + 1.0) * direction;
  iPos = floor(grid1);
  fPos = fract(grid1);
  
  float offset = random(1.0 + iPos.y);
  
  float block = getColor(random(iPos + 1.0 + offset),random(iPos.y + offset));
  vec3 color = vec3(block);
  color = mix(backColor,color,block);

  outputColor = vec4(color, 1.0);
} `


const RANDOM_PIXEL_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

out vec4 outputColor;

uniform vec2 canvasSize;
uniform vec2 mousePosition;
uniform float timePassed;

#define PI 3.14159265358979323846

float random (vec2 position){
  vec2 multVec = vec2(12.9898,78.233);
  float multFloat = 43758.5453123;
  return fract(sin(dot(position.xy,multVec)) * multFloat);
}

void main() {
  vec2 position = gl_FragCoord.xy / canvasSize;
  float speed = 0.1;


  vec2 grid1 = position + vec2(timePassed * speed ,0.0);
  grid1 = grid1 *= 10.0;
  vec2 iPos = floor(grid1);
  vec2 fPos = fract(grid1);
  
  vec3 color = vec3(random(iPos));

  outputColor = vec4(color, 1.0);
} `

const TRIANGLE_PATTERN_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

out vec4 outputColor;

uniform vec2 canvasSize;
// uniform vec2 mousePosition;
uniform float timePassed;

#define PI 3.14159265358979323846

vec2 rotate2d(vec2 position,float angle){
  position -= 0.5;
  position = mat2(cos(angle),-sin(angle),sin(angle),cos(angle)) * position;
  position += 0.5;
  return position;
}

vec2 tile(vec2 position,float zoom){
  position *= zoom;
  return fract(position);
}

vec2 rotateTilePattern(vec2 position){
  position *= 2.0;

  float index = 0.0;
  index += step(1.0,mod(position.x,2.0));
  index += step(1.0,mod(position.y,2.0)) * 2.0;
  
  position = fract(position);

  if (index == 1.0){
    position = rotate2d(position,PI * 0.5);
  }else if (index == 2.0){
    position = rotate2d(position,PI * -0.5);
  }else if (index == 3.0){
    position = rotate2d(position,PI);
  }

  return position;
}

void main() {
  vec2 position = gl_FragCoord.xy / canvasSize;
  
  vec2 grid1 = tile(position,3.0);
  grid1 = rotateTilePattern(grid1);

  // grid1 = tile(grid1,2.0);
  grid1 = rotate2d(grid1,timePassed);
  
  vec3 color = vec3(step(grid1.x,grid1.y));

  outputColor = vec4(color, 1.0);
} `

const MOVE_GRID_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

out vec4 outputColor;

uniform vec2 canvasSize;
// uniform vec2 mousePosition;
uniform float timePassed;

float box(vec2 position,float size){
  vec2 result = step(vec2(0.5) - size,position) - step(vec2(0.5) + size,position);
  return result.x * result.y;
}

vec2 brickTile(vec2 position, float zoom,float speed){
  float time = timePassed * speed;
  float move = step(1.0,mod(time,2.0));
  position *= zoom;

  float oddRow = step(1.0,mod(position.y,2.0));
  oddRow = oddRow * 2.0 - 1.0;
  position.x += oddRow * time * move;

  float oddCol = step(1.0,mod(position.x,2.0));
  oddCol = oddCol * 2.0 - 1.0;
  position.y += oddCol * time * (1.0 - move);


  return fract(position);
}

void main() {
  vec2 position = gl_FragCoord.xy / canvasSize;
  vec3 color = vec3(timePassed);
  float speed = 5.0;

  position = brickTile(position,5.0,speed);
  
  color = vec3(box(position,0.1));

  outputColor = vec4(color, 1.0);
} `

const QILT_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

out vec4 outputColor;

uniform vec2 canvasSize;
// uniform vec2 mousePosition;
uniform float timePassed;

vec2 rotate2d(vec2 position,float angle){
  position -= 0.5;
  mat2 rotateMatrix = mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
  position *= rotateMatrix;
  position += 0.5;
  return position;
}

float box(vec2 position,float size){
  vec2 result = step(vec2(0.5) - size,position) - step(vec2(0.5) + size,position);
  return result.x * result.y;
}

vec2 positionEvenOdd(vec2 position){
  vec2 result = mod(floor(position),2.0); 
  return result;
}

vec3 black = vec3(0.0);
vec3 white = vec3(1.0);

void main() {
  vec2 position = gl_FragCoord.xy / canvasSize;
  vec2 startPosition = gl_FragCoord.xy / canvasSize;
  position  *= vec2(10.0);
  vec2 posEvenOdd = positionEvenOdd(position);
  position *= vec2(0.5);
  position = fract(position);
  // position = rotate2d(position,timePassed * 0.5);
 
  position = fract(position);

  float mainGrid = min(posEvenOdd.x + posEvenOdd.y,1.0) - posEvenOdd.x * posEvenOdd.y;
  mainGrid = 1.0 - mainGrid;
  float nextGrid = 1.0 - step(0.5,startPosition.x);
  vec3 color = vec3(mainGrid * nextGrid);


  outputColor = vec4(color, 1.0);
} `

const SPINNING_GRID_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

out vec4 outputColor;

uniform vec2 canvasSize;
// uniform vec2 mousePosition;
uniform float timePassed;

vec2 rotate2d(vec2 position,float angle){
  position -= 0.5;
  mat2 rotateMatrix = mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
  position *= rotateMatrix;
  position += 0.5;
  return position;
}

float box(vec2 position,float size){
  vec2 result = step(vec2(0.5) - size,position) - step(vec2(0.5) + size,position);
  return result.x * result.y;
}

void main() {
  vec2 position = gl_FragCoord.xy / canvasSize;
  position  *= vec2(3.0);
  position = fract(position);
  position = rotate2d(position,timePassed * 0.5);
  
  vec3 color = vec3(box(position,0.354));
  outputColor = vec4(color, 1.0);
} `


const TIC_TAC_TOE_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

out vec4 outputColor;

uniform vec2 canvasSize;
// uniform vec2 mousePosition;
uniform float timePassed;

float circleShape(float size,vec2 position){
  float distanceFromCenter = distance(vec2(0.5),position);
  float result = step(distanceFromCenter,size);
  return result;
}

float squareShape(float size,vec2 position){
  size *= 0.5;
  float horizontal = step(0.5 - size,position.x) - step(0.5 + size,position.x);
  float vertical = step(0.5 - size,position.y) - step(0.5 + size,position.y);
  return horizontal * vertical;
}

float lineShape(float size,float sides,in vec2 position){
  position.y = 1.0 - position.y;
  float result = step(position.x - size,position.y) - step(position.x + size,position.y);
  vec2 validSides = step(vec2(sides),position) - step(vec2(1.0 - sides),position);
  return result * validSides.x * validSides.y;
}

void main() {
  vec2 position = gl_FragCoord.xy / canvasSize;
  // position *= abs(sin(timePassed)) * 5.0 + 5.0;
  vec2 totalPos = position;
  position  *= vec2(3.0);
  position = fract(position);

  vec3 color = vec3(position,1.0);
  vec3 circleColor = vec3(1.0,0.0,0.0);
  vec3 squareColor = vec3(1.0,1.0,0.0);

  float validCircle = circleShape(0.3,position);
  float validSquare = squareShape(0.6,position);
  float validLine = lineShape(0.02,0.05,totalPos);

  float c0 = step(totalPos.x,0.33);
  float c1 = step(totalPos.x,0.66) - step(totalPos.x,0.33);
  float c2 = step(totalPos.x,1.0) - step(totalPos.x,0.66);

  float r0 = step(totalPos.y,0.33);
  float r1 = step(totalPos.y,0.66) - step(totalPos.y,0.33);
  float r2 = step(totalPos.y,1.0) - step(totalPos.y,0.66);

  color = mix(color,circleColor,validCircle * c0 * r2);
  color = mix(color,circleColor,validCircle * c2 * r2);
  color = mix(color,circleColor,validCircle * c2 * r0);
  color = mix(color,circleColor,validCircle * c1 * r1);
  color = mix(color,squareColor,validSquare * c0 * r0);
  color = mix(color,squareColor,validSquare * c1 * r2);
  color = mix(color,squareColor,validSquare * c2 * r1);

  color = mix(color,vec3(1.0),validLine);
  outputColor = vec4(color, 1.0);
} `

const SPINNING_CROSS_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

out vec4 outputColor;

uniform vec2 canvasSize;
// uniform vec2 mousePosition;
uniform float timePassed;

float PI = 3.141569;

float rect(vec2 rectPosition, vec2 rectSize, vec2 fragmentPosition){
  float xInLeft = step(rectPosition.x, fragmentPosition.x);
  float yInBottom = step(rectPosition.y, fragmentPosition.y);

  float xInRight = 1.0 - step(rectPosition.x + rectSize.x, fragmentPosition.x);
  float yInTop = 1.0 - step(rectPosition.y + rectSize.y, fragmentPosition.y);

  float result = xInLeft * xInRight * yInTop * yInBottom;

  return result;
}

float crossShape(float size, vec2 fragmentPosition){
  vec2 crossPosition = vec2(0.5);
  float result = rect(crossPosition - vec2(size * 0.125,size * 0.5),vec2(size * 0.25,size),fragmentPosition);
  result += rect(crossPosition - vec2(size * 0.5,size * 0.125),vec2(size,size * 0.25),fragmentPosition);
  return result;
}

mat2 rotate2d(float angle){
  return mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
}

mat2 scale(vec2 scale){
  return mat2(scale.x,0.0,0.0,scale.y);
}

void main() {
  vec2 position = gl_FragCoord.xy / canvasSize;
  float spinSpeed = 10.0;
  position -= vec2(0.5);
  // position -= vec2(cos(timePassed * spinSpeed),sin(timePassed * spinSpeed)) * 0.2;
  position *= rotate2d(timePassed * spinSpeed);
  position *= scale(vec2(sin(timePassed) * 1.0) - 2.0);
  position += vec2(0.5);

  vec3 shapeColor = vec3(1.0);
  vec3 color = vec3(position.x,position.y,abs(sin(timePassed)));

  float validShape = crossShape(0.5,position);
  color = mix(color, shapeColor, validShape);

  outputColor = vec4(color, 1.0);
} `

const TRIANGLE_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

out vec4 outputColor;
uniform vec2 canvasSize;
// uniform vec2 mousePosition;
// uniform float timePassed;

#define PI 3.14159265359
#define TWO_PI 6.28318530718

void main() {
  vec2 position = gl_FragCoord.xy / canvasSize;
  position = position * 2.0 - 1.0;

  vec3 color = vec3(0.0);

  int sides = 3;

  float angle = atan(position.x,position.y) + PI;
  float radius = TWO_PI / float(sides);
  
  float distance = cos(floor(.5+angle/radius)*radius-angle)*length(position);
  
  color = vec3(1.0 - step(0.3,distance));
  outputColor = vec4(color,1.0);
}`;

const SPINNING_CIRCLE_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

out vec4 outputColor;

uniform vec2 canvasSize;
// uniform vec2 mousePosition;
uniform float timePassed;

float PI = 3.141569;

float rect(vec2 rectPosition, vec2 rectSize, vec2 fragmentPosition){
  float xInLeft = step(rectPosition.x, fragmentPosition.x);
  float yInBottom = step(rectPosition.y, fragmentPosition.y);

  float xInRight = 1.0 - step(rectPosition.x + rectSize.x, fragmentPosition.x);
  float yInTop = 1.0 - step(rectPosition.y + rectSize.y, fragmentPosition.y);

  float result = xInLeft * xInRight * yInTop * yInBottom;

  return result;
}

float circle(vec2 circlePosition, float radius, vec2 fragmentPosition){
  float distance = distance(circlePosition, fragmentPosition);
  float result = step(distance, radius);
  return result;
}


void main() {
  vec2 position = gl_FragCoord.xy / canvasSize;

  vec3 shapeColor = vec3(1.0);
  vec3 color = vec3(0.0);
  float size = sin(timePassed) / 20.0 + 0.1;
  float validShape = circle(vec2(0.5, 0.5), size, position);
  color = mix(color, shapeColor, validShape);

  float radiusFromCenter = 0.3;

  float circleRadius1 = 0.03;
  float circleRotationSpeed1 = 5.0;
  vec2 circlePos1 = vec2(cos(timePassed * circleRotationSpeed1), sin(timePassed * circleRotationSpeed1)) * vec2(radiusFromCenter) + vec2(0.5, 0.5);

  float circleRadius2 = 0.03;
  float circleRotationSpeed2 = 5.0;
  vec2 circlePos2 = vec2(cos(timePassed * circleRotationSpeed2 - PI / 2.0), sin(timePassed * circleRotationSpeed2 - PI / 2.0)) * vec2(radiusFromCenter) + vec2(0.5, 0.5);

  float circleRadius3 = 0.03;
  float circleRotationSpeed3 = 5.0;
  vec2 circlePos3 = vec2(cos(timePassed * circleRotationSpeed3 - PI), sin(timePassed * circleRotationSpeed3 - PI)) * vec2(radiusFromCenter) + vec2(0.5, 0.5);

  float circleRadius4 = 0.03;
  float circleRotationSpeed4 = 5.0;
  vec2 circlePos4 = vec2(cos(timePassed * circleRotationSpeed4 - 3.0 * PI / 2.0), sin(timePassed * circleRotationSpeed4 - 3.0 * PI / 2.0)) * vec2(radiusFromCenter) + vec2(0.5, 0.5);

  validShape = circle(circlePos1, circleRadius1, position);
  color = mix(color, shapeColor, validShape);

  validShape = circle(circlePos2, circleRadius2, position);
  color = mix(color, shapeColor, validShape);

  validShape = circle(circlePos3, circleRadius3, position);
  color = mix(color, shapeColor, validShape);

  validShape = circle(circlePos4, circleRadius4, position);
  color = mix(color, shapeColor, validShape);

  outputColor = vec4(color, 1.0);
} `

const COLOR_PICKER_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

#define TWO_PI 6.28318530718

out vec4 outputColor;

uniform vec2 canvasSize;
uniform vec2 mousePosition;
// uniform float timePassed;

vec3 colorA = vec3(0.149, 0.141, 0.912);
vec3 colorB = vec3(1.000, 0.833, 0.224);

vec3 rgb2hsb( in vec3 c){
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz),
  vec4(c.gb, K.xy),
  step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r),
    vec4(c.r, p.yzx),
    step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)),
    d / (q.x + e),
    q.x);
}

vec3 hsb2rgb( in vec3 c){
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0),
  6.0) - 3.0) - 1.0,
  0.0,
  1.0);
  rgb = rgb * rgb * (3.0 - 2.0 * rgb);
  return c.z * mix(vec3(1.0), rgb, c.y);
}

void main() {
  vec2 position = gl_FragCoord.xy / canvasSize;
  vec2 mousePos = mousePosition / canvasSize;

  vec2 toCenter = vec2(0.5) - position;
  float angleToCenter = atan(toCenter.y, toCenter.x);
  float radius = length(toCenter) * 2.0;
  float normalizedAngle = (angleToCenter / TWO_PI) + 0.5;

  vec2 mouseToCenter = vec2(0.5) - mousePos;
  float mouseAngleToCenter = atan(mouseToCenter.y, mouseToCenter.x);
  float mouseRadius = length(mouseToCenter) * 2.0;
  float mouseNormalizedAngle = (mouseAngleToCenter / TWO_PI) + 0.5;
  vec3 mouseColor = hsb2rgb(vec3(mouseNormalizedAngle, mouseRadius, 1.0));

  float distanceToMouse = distance(position, mousePos);
  float closePercent = step(0.08, distanceToMouse);
  float edgePercent = step(0.08, distanceToMouse) - step(0.085, distanceToMouse);

  vec3 color = hsb2rgb(vec3(normalizedAngle, radius, 1.0));
  
  vec3 finalColor = mix(mouseColor, color, closePercent);
  finalColor = mix(finalColor, vec3(1.0, 1.0, 1.0), edgePercent);


  outputColor = vec4(finalColor, 1.0);
} `



export { FRAGMENT_SHADER }

