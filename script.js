const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl'); // hoặc 'experimental-webgl'
if (!gl) {
    alert('Không thể khởi tạo WebGL.');
}

// Resize canvas to fit window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Shader nguồn
const vertexShaderSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aColor;
    varying vec4 vColor;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        gl_PointSize = 5.0; // Kích thước điểm ảnh, có thể điều chỉnh
        vColor = aColor;
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    varying vec4 vColor;
    void main() {
        gl_FragColor = vColor;
    }
`;

// Hàm tạo shader
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Lỗi biên dịch shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// Tạo chương trình shader
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);

if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error('Không thể liên kết chương trình shader:', gl.getProgramInfoLog(shaderProgram));
}

gl.useProgram(shaderProgram);

// Lấy vị trí thuộc tính và uniform
const vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
const colorAttribute = gl.getAttribLocation(shaderProgram, 'aColor');
const modelViewMatrixUniform = gl.getUniformLocation(shaderProgram, 'uModelViewMatrix');
const projectionMatrixUniform = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix');

let particleCount = parseInt(document.getElementById('particleCount').value);
let particles = [];

function generateParticles(count) {
    const newParticles = [];
    for (let i = 0; i < count; i++) {
        const x = (Math.random() * 2 - 1) * 5; // Giới hạn trong khoảng -5 đến 5
        const y = (Math.random() * 2 - 1) * 5;
        const z = (Math.random() * 2 - 1) * 5;
        const r = Math.random();
        const g = Math.random();
        const b = Math.random();
        newParticles.push({
            position: [x, y, z],
            color: [r, g, b, 1.0]
        });
    }
    return newParticles;
}

particles = generateParticles(particleCount); // Khởi tạo hạt ban đầu

// Update particle count when input changes
document.getElementById('particleCount').addEventListener('input', (event) => {
    particleCount = parseInt(event.target.value);
    particles = generateParticles(particleCount);
});

// Buffer cho vị trí và màu sắc
const positionBuffer = gl.createBuffer();
const colorBuffer = gl.createBuffer();

function updateBuffers() {
    // Vị trí
    const positions = particles.flatMap(p => p.position);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Màu sắc
    const colors = particles.flatMap(p => p.color);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
}

function drawScene() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Màu nền đen
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Ma trận
    const fieldOfView = 45 * Math.PI / 180;   // Góc nhìn
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix,     // destination matrix
                   modelViewMatrix,     // matrix to translate
                   [0, 0, -10]);       // amount to translate
    mat4.rotate(modelViewMatrix,  // matrix to rotate
                  modelViewMatrix,  // matrix to be rotated
                  0.5,     // amount to rotate in radians
                  [0, 1, 0]);       // axis to rotate around (X, Y, Z)


    gl.uniformMatrix4fv(projectionMatrixUniform, false, projectionMatrix);
    gl.uniformMatrix4fv(modelViewMatrixUniform, false, modelViewMatrix);

    // Vẽ
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(
        vertexPositionAttribute,
        3, // Số thành phần trên mỗi vị trí (x, y, z)
        gl.FLOAT,
        false,
        0,
        0
    );
    gl.enableVertexAttribArray(vertexPositionAttribute);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(
        colorAttribute,
        4, // Số thành phần cho màu (r, g, b, a)
        gl.FLOAT,
        false,
        0,
        0
    );
    gl.enableVertexAttribArray(colorAttribute);

    gl.drawArrays(gl.POINTS, 0, particles.length);
}

function renderLoop() {
    updateBuffers();
    drawScene();
    requestAnimationFrame(renderLoop);
}

renderLoop();

// Toggle shader
const shaderToggle = document.getElementById('shaderToggle');
shaderToggle.addEventListener('change', () => {
    //TODO: Implement shader toggle logic here.
    //This would involve replacing the shader program with a different one
    // or modifying the existing one to disable/enable certain effects.
});