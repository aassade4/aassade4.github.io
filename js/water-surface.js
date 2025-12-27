class ImaginarySpace {
    constructor(container, options = {}) {
        this.container = container;
        this.width = options.width || 960;
        this.height = options.height || 120;
        this.resolution = options.resolution || 256;
        
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'auto';
        
        this.container.appendChild(this.canvas);
        
        this.gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }
        
        this.time = 0;
        this.mousePos = { x: 0.5, y: 0.5 };
        this.mouseVelocity = { x: 0, y: 0 };
        this.lastMousePos = { x: 0.5, y: 0.5 };
        
        this.init();
    }
    
    init() {
        this.createShaders();
        this.createBuffers();
        this.setupEventListeners();
        this.animate();
    }
    
    createShaders() {
        const gl = this.gl;
        
        const vertexShaderSource = `
            attribute vec2 a_position;
            attribute vec2 a_texCoord;
            
            varying vec2 v_texCoord;
            varying vec3 v_position;
            
            void main() {
                v_texCoord = a_texCoord;
                v_position = vec3(a_position, 0.0);
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
        
        const fragmentShaderSource = `
            precision highp float;
            
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform vec2 u_mouse;
            uniform vec2 u_mouseVelocity;
            
            varying vec2 v_texCoord;
            varying vec3 v_position;
            
            #define PI 3.14159265359
            
            vec3 baseColor = vec3(0.043, 0.051, 0.086);
            vec3 violetColor = vec3(0.5, 0.0, 0.5);
            vec3 cyanColor = vec3(0.0, 0.8, 0.8);
            
            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
            }
            
            float hash3(vec3 p) {
                return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
            }
            
            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                
                float a = hash(i);
                float b = hash(i + vec2(1.0, 0.0));
                float c = hash(i + vec2(0.0, 1.0));
                float d = hash(i + vec2(1.0, 1.0));
                
                return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
            }
            
            float simplexNoise(vec3 p) {
                const float K1 = 0.333333333;
                const float K2 = 0.166666667;
                
                vec3 i = floor(p + (p.x + p.y + p.z) * K1);
                vec3 d0 = p - i + (i.x + i.y + i.z) * K2;
                
                vec3 e = step(d0.yzx, d0);
                vec3 i1 = e * (1.0 - e.zxy);
                vec3 i2 = 1.0 - e.zxy * (1.0 - e);
                
                vec3 x1 = d0 - i1 + K2;
                vec3 x2 = d0 - i2 + 2.0 * K2;
                vec3 x3 = d0 - 1.0 + 3.0 * K2;
                
                vec4 h = max(0.6 - vec4(dot(d0, d0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
                vec4 n = h * h * h * h * vec4(dot(d0, vec3(0.0, 1.0, 1.0)), 
                                                 dot(x1, vec3(1.0, 0.0, 1.0)), 
                                                 dot(x2, vec3(1.0, 1.0, 0.0)), 
                                                 dot(x3, vec3(1.0, 1.0, 1.0)));
                
                return dot(n, vec4(31.316));
            }
            
            float worleyNoise(vec2 uv) {
                vec2 i_st = floor(uv);
                vec2 f_st = fract(uv);
                
                float m_dist = 1.0;
                
                for (int y = -1; y <= 1; y++) {
                    for (int x = -1; x <= 1; x++) {
                        vec2 neighbor = vec2(float(x), float(y));
                        vec2 point = neighbor + hash3(vec3(i_st + neighbor, 0.0));
                        
                        float dist = length(f_st - point);
                        m_dist = min(m_dist, dist);
                    }
                }
                
                return m_dist;
            }
            
            float viscousFluid(vec2 uv, float time) {
                float value = 0.0;
                float amplitude = 0.5;
                float frequency = 1.0;
                float speed = 0.05;
                
                for (int i = 0; i < 5; i++) {
                    vec3 noiseCoord = vec3(uv * frequency, time * speed);
                    value += amplitude * simplexNoise(noiseCoord);
                    amplitude *= 0.6;
                    frequency *= 1.8;
                    speed *= 0.8;
                }
                
                return value * 0.5 + 0.5;
            }
            
            float cellularTexture(vec2 uv, float time) {
                float w1 = worleyNoise(uv * 3.0 + time * 0.02);
                float w2 = worleyNoise(uv * 6.0 - time * 0.03);
                return w1 * 0.7 + w2 * 0.3;
            }
            
            vec3 computeNormal(vec2 uv, float time) {
                float eps = 0.005;
                float hC = viscousFluid(uv, time);
                float hL = viscousFluid(uv + vec2(-eps, 0.0), time);
                float hR = viscousFluid(uv + vec2(eps, 0.0), time);
                float hD = viscousFluid(uv + vec2(0.0, -eps), time);
                float hU = viscousFluid(uv + vec2(0.0, eps), time);
                
                vec3 normal = normalize(vec3(hL - hR, hD - hU, 2.0 * eps));
                return normal;
            }
            
            float fresnel(vec3 viewDir, vec3 normal, float power) {
                float cosTheta = max(dot(viewDir, normal), 0.0);
                return pow(1.0 - cosTheta, power);
            }
            
            float starPulse(vec2 uv, float time) {
                float n = hash(uv * 100.0);
                float pulse = sin(time * 2.0 + n * PI * 2.0) * 0.5 + 0.5;
                return pulse * pulse;
            }
            
            vec3 renderStars(vec2 uv, float time, float fluidHeight) {
                vec3 starColor = vec3(0.0);
                
                for (int i = 0; i < 50; i++) {
                    float fi = float(i);
                    vec2 starPos = vec2(hash(vec2(fi, 0.0)), hash(vec2(fi, 1.0)));
                    float starSize = hash(vec2(fi, 2.0)) * 0.003 + 0.001;
                    
                    vec2 offset = vec2(sin(time * 0.1 + fi) * 0.02, cos(time * 0.15 + fi) * 0.02);
                    starPos += offset;
                    starPos.y += fluidHeight * 0.05;
                    
                    float dist = length(uv - starPos);
                    float star = smoothstep(starSize, starSize * 0.3, dist);
                    
                    float pulse = starPulse(starPos, time);
                    float intensity = pulse * 0.8 + 0.2;
                    
                    vec3 color = mix(cyanColor, violetColor, hash(vec2(fi, 3.0)));
                    starColor += color * star * intensity;
                }
                
                return starColor;
            }
            
            float exponentialSquaredFog(float dist, float density) {
                return 1.0 - exp(-dist * dist * density);
            }
            
            float vignette(vec2 uv, float strength) {
                vec2 center = vec2(0.5);
                float dist = length(uv - center);
                return smoothstep(0.5, 0.5 - strength, dist);
            }
            
            void main() {
                vec2 uv = v_texCoord;
                
                float fluid = viscousFluid(uv, u_time);
                float cellular = cellularTexture(uv, u_time);
                
                vec3 normal = computeNormal(uv, u_time);
                
                vec3 viewDir = vec3(0.0, 0.0, 1.0);
                float fresnelTerm = fresnel(viewDir, normal, 2.5);
                
                vec3 fluidColor = baseColor;
                
                vec3 highlightColor = mix(violetColor, cyanColor, cellular);
                highlightColor *= smoothstep(0.4, 0.6, fluid);
                
                vec3 emissiveColor = highlightColor * 0.4;
                emissiveColor *= fresnelTerm * 2.0;
                
                fluidColor += emissiveColor;
                
                vec3 stars = renderStars(uv, u_time, fluid);
                fluidColor += stars * 0.6;
                
                float mouseDist = length(uv - u_mouse);
                float mouseInfluence = smoothstep(0.25, 0.0, mouseDist) * length(u_mouseVelocity);
                
                float disturbance = sin(mouseDist * 40.0 - u_time * 3.0) * mouseInfluence;
                fluidColor += cyanColor * disturbance * 0.2;
                
                float fog = exponentialSquaredFog(length(uv - vec2(0.5)), 3.0);
                fluidColor = mix(fluidColor, baseColor * 0.3, fog * 0.5);
                
                float vig = vignette(uv, 0.6);
                fluidColor *= vig;
                
                fluidColor = pow(fluidColor, vec3(0.9));
                
                gl_FragColor = vec4(fluidColor, 0.85);
            }
        `;
        
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
        
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);
        
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(this.program));
            return;
        }
        
        gl.useProgram(this.program);
        
        this.uniforms = {
            time: gl.getUniformLocation(this.program, 'u_time'),
            resolution: gl.getUniformLocation(this.program, 'u_resolution'),
            mouse: gl.getUniformLocation(this.program, 'u_mouse'),
            mouseVelocity: gl.getUniformLocation(this.program, 'u_mouseVelocity')
        };
    }
    
    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    createBuffers() {
        const gl = this.gl;
        
        const positions = new Float32Array([
            -1.0, -1.0,
             1.0, -1.0,
            -1.0,  1.0,
             1.0,  1.0
        ]);
        
        const texCoords = new Float32Array([
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            1.0, 1.0
        ]);
        
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        
        const positionLocation = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        
        const texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
        
        const texCoordLocation = gl.getAttribLocation(this.program, 'a_texCoord');
        gl.enableVertexAttribArray(texCoordLocation);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = 1.0 - (e.clientY - rect.top) / rect.height;
            
            this.mouseVelocity.x = x - this.lastMousePos.x;
            this.mouseVelocity.y = y - this.lastMousePos.y;
            this.mousePos.x = x;
            this.mousePos.y = y;
            this.lastMousePos.x = x;
            this.lastMousePos.y = y;
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.mouseVelocity.x = 0;
            this.mouseVelocity.y = 0;
        });
    }
    
    animate() {
        const gl = this.gl;
        
        this.time += 0.016;
        
        gl.viewport(0, 0, this.width, this.height);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(this.program);
        
        gl.uniform1f(this.uniforms.time, this.time);
        gl.uniform2f(this.uniforms.resolution, this.width, this.height);
        gl.uniform2f(this.uniforms.mouse, this.mousePos.x, this.mousePos.y);
        gl.uniform2f(this.uniforms.mouseVelocity, this.mouseVelocity.x, this.mouseVelocity.y);
        
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        
        this.mouseVelocity.x *= 0.92;
        this.mouseVelocity.y *= 0.92;
        
        requestAnimationFrame(() => this.animate());
    }
    
    destroy() {
        if (this.gl) {
            this.gl.deleteProgram(this.program);
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}
