document.addEventListener('DOMContentLoaded', () => {

    // --- 配置和初始化 ---
    const initApp = () => {
        setTimeout(() => {
            const loader = document.getElementById('loading-layer');
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
                revealContent();
            }, 800);
        }, 1500); // Simulated delay
    };

    const revealContent = () => {
        const main = document.getElementById('main-interface');
        main.style.opacity = '1';
        main.style.transform = 'translateY(0)';
    };

    // --- 导航样式保持 ---

    // --- 带立方体的3D轨道逻辑 ---
    const createOrbitSystem = () => {
        const system = document.getElementById('chaldeas-system');
        const items = ['算法', '前端', '后端', '数据库', '人工智能', 'C++'];
        const radius = 280; // 距离中心的距离

        items.forEach((text, index) => {
            // Calculate position on a circle (XZ plane)
            const angle = (index / items.length) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            // Create Cube DOM Structure
            const cube = document.createElement('div');
            cube.className = 'orbit-cube';

            // Initial Position using translate3d
            // Crucial: The rotation ensures the cube faces the center initially if needed, 
            // but for "orbiting" usually we just place them.
            // We apply a counter-animation to the cube container to make it "tumble" or look 3D
            cube.style.transform = `translate3d(${x}px, 0, ${z}px)`;

            // Create 6 Faces
            const faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
            faces.forEach(faceClass => {
                const face = document.createElement('div');
                face.className = `cube-face ${faceClass}`;
                // Only show text on some faces to avoid clutter
                if (faceClass === 'front' || faceClass === 'right' || faceClass === 'top') {
                    face.innerText = text;
                    face.style.border = `1px solid rgba(${Math.random() * 255}, 200, 255, 0.8)`;
                }
                cube.appendChild(face);
            });

            // Add self-rotation animation to each cube specifically
            // This makes the cube spin on its own axis while orbiting the center
            cube.animate([
                { transform: `translate3d(${x}px, 0, ${z}px) rotate3d(1, 1, 1, 0deg)` },
                { transform: `translate3d(${x}px, 0, ${z}px) rotate3d(1, 1, 1, 360deg)` }
            ], {
                duration: 10000 + Math.random() * 5000,
                iterations: Infinity,
                easing: 'linear'
            });

            system.appendChild(cube);
        });
    };

    // --- 时间线生成器 ---
    const generateTimeline = () => {
        const axis = document.getElementById('timeline-root');
        
        // 检查axis元素是否存在
        if (!axis) {
            console.warn('Timeline root element not found, skipping timeline generation.');
            return;
        }
        
        const logs = [
            { date: '2025/12/27', title: '美化特效增加', desc: '做了新的美化特效在细分区块内，做了个虚数之海特效' },
            { date: '2025/12/15', title: '系统升级', desc: '优化了渲染引擎。' },
            { date: '2025/11/20', title: '新的奇点', desc: '开始研究WebGL着色器。' },
            { date: '2025/10/05', title: '博客上线', desc: '部署了博客的初始版本。' }
        ];

        logs.forEach(log => {
            const el = document.createElement('div');
            el.className = 'timeline-item';
            el.innerHTML = `
                <div style="font-family: var(--f-body); color: var(--c-gold); font-size: 0.8rem;">${log.date}</div>
                <h4 style="color: #eee; margin: 5px 0; font-family: var(--f-body);">${log.title}</h4>
                <p style="color: #888; font-size: 0.9rem; font-family: var(--f-body);">${log.desc}</p>
            `;
            axis.appendChild(el);
        });
    };

    // --- 交叉观察器（滚动动画）---
    const observeElements = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('show');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.timeline-item').forEach(el => observer.observe(el));
    };

    // --- FGO 全局点击效果 ---
    window.addEventListener('click', function( e ) {
        const fx = document.createElement('div');
        fx.className = 'click-fx';
        
        fx.style.left = e.clientX + 'px';
        fx.style.top = e.clientY + 'px';
        
        document.body.appendChild(fx);
        
        // 使用 Web Animations API 代替 style.animation，
        // 这样可以避免覆盖 style.transform 导致的闪烁问题
        fx.animate([
            { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
            { transform: 'translate(-50%, -50%) scale(3)', opacity: 0 }
        ], { 
            duration: 500,
            easing: 'ease-out',
            fill: 'forwards'
        });
        // 动画结束后移除元素
        setTimeout(() => fx.remove(), 600);
    });

    // 运行所有函数
    console.log('Running all functions...');
    initApp();
    createOrbitSystem();
    
    // 只在首页生成时间线
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
        console.log('Calling generateTimeline...');
        generateTimeline();
        setTimeout(observeElements, 1000); // Wait for DOM generation
    }
});
