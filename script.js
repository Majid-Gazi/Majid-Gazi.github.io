// --- 1. INIT & LOADING ---
gsap.registerPlugin(ScrollTrigger);

const preloader = document.querySelector('.preloader');
const counter = document.querySelector('.counter');

// Check if we're already loaded (for page refreshes)
if (document.readyState === 'complete') {
    // Page already loaded, skip preloader
    preloader.style.display = 'none';
    initializePage();
} else {
    // Simulated Loading Sequence
    let loadCount = 0;
    const loadingInterval = setInterval(() => {
        loadCount += Math.floor(Math.random() * 10) + 1;
        if (loadCount > 100) loadCount = 100;
        counter.innerHTML = loadCount + "%";
        
        if (loadCount === 100) {
            clearInterval(loadingInterval);
            startEntrance();
        }
    }, 40);
}

function startEntrance() {
    const tl = gsap.timeline();

    // Set initial positions for animation
    gsap.set(".hero-text-small", { yPercent: 100 });
    gsap.set(".hero-text-large", { yPercent: 110 });
    gsap.set(".hero-text-sub", { opacity: 0 });

    tl.to(counter, { y: -50, opacity: 0, duration: 0.5, ease: "power2.in" })
      .to(preloader, { yPercent: -100, duration: 1.2, ease: "power4.inOut" })
      .to(".hero-text-small", { yPercent: 0, duration: 1, ease: "power3.out" }, "-=0.5")
      .to(".hero-text-large", { yPercent: 0, duration: 1.5, ease: "power4.out", stagger: 0.1 }, "-=0.8")
      .to(".hero-text-sub", { opacity: 1, duration: 1, ease: "power2.out" }, "-=0.5")
      .call(initializePage); // Initialize the rest of the page after entrance
}

function initializePage() {
    // --- 2. SMOOTH SCROLL (Lenis) ---
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Sync GSAP with Lenis
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    // --- 3. CUSTOM MOUSE & MAGNETIC EFFECT ---
    const cursorOuter = document.getElementById('cursor-outer');
    const cursorInner = document.getElementById('cursor-inner');
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;

    if (cursorOuter && cursorInner) {
        window.addEventListener('mousemove', e => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            // Move Inner Cursor instantly
            gsap.set(cursorInner, { x: mouseX - 3, y: mouseY - 3 });
        });

        // Physics for Outer Cursor (Lag Effect)
        gsap.ticker.add(() => {
            const dt = 1.0 - Math.pow(1.0 - 0.15, gsap.ticker.deltaRatio());
            cursorX += (mouseX - cursorX) * dt;
            cursorY += (mouseY - cursorY) * dt;
            gsap.set(cursorOuter, { x: cursorX - 20, y: cursorY - 20 });
        });

        // Magnetic Elements & Hover States
        const magneticElements = document.querySelectorAll('[data-magnetic]');
        
        magneticElements.forEach((el) => {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                // Move element slightly towards mouse
                gsap.to(el, { x: x * 0.3, y: y * 0.3, duration: 0.5, ease: "power2.out" });
                // Scale cursor up
                gsap.to(cursorOuter, { scale: 1.5, opacity: 0.5, duration: 0.3 });
            });

            el.addEventListener('mouseleave', () => {
                gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.3)" });
                gsap.to(cursorOuter, { scale: 1, opacity: 1, duration: 0.3 });
            });
        });

        // Change cursor on Hover triggers
        document.querySelectorAll('.hover-trigger').forEach(el => {
            el.addEventListener('mouseenter', (e) => {
                cursorOuter.classList.add('scale-150', 'border-0', 'bg-white', 'mix-blend-difference');
                cursorInner.classList.add('hidden');
                
                const text = el.getAttribute('data-cursor-text');
                if (text) {
                    // Optional: Could insert text into cursor here
                }
            });
            el.addEventListener('mouseleave', () => {
                cursorOuter.classList.remove('scale-150', 'border-0', 'bg-white', 'mix-blend-difference');
                cursorInner.classList.remove('hidden');
            });
        });
    }

    // --- 4. THREE.JS BACKGROUND ---
    const container = document.getElementById('canvas-container');
    if (container && typeof THREE !== 'undefined') {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        // Create Particles
        const particlesGeometry = new THREE.BufferGeometry();
        const counts = 3000;
        const positions = new Float32Array(counts * 3);

        for (let i = 0; i < counts * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 15;
        }
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.015,
            color: 0x666666,
        });

        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particles);

        camera.position.z = 3;

        // Animate Particles
        let time = 0;
        
        function animateThree() {
            requestAnimationFrame(animateThree);
            time += 0.001;

            particles.rotation.y += 0.0005;
            
            const positions = particles.geometry.attributes.position.array;
            
            for (let i = 0; i < counts; i++) {
                const x = positions[i * 3];
                const y = positions[i * 3 + 1];
                positions[i * 3 + 1] = y + Math.sin(time + x * 0.5) * 0.002;
            }
            
            particles.geometry.attributes.position.needsUpdate = true;

            camera.position.x += (mouseX / window.innerWidth - 0.5 - camera.position.x) * 0.05;
            camera.position.y += (-(mouseY / window.innerHeight) + 0.5 - camera.position.y) * 0.05;

            renderer.render(scene, camera);
        }

        animateThree();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    // --- 5. MARQUEE ANIMATION ---
    const marqueeWrapper = document.querySelector(".marquee-wrapper");
    if (marqueeWrapper) {
        gsap.to(".marquee-wrapper", {
            xPercent: -50,
            repeat: -1,
            duration: 20,
            ease: "linear"
        });
    }

    // --- 6. SCROLL REVEALS ---
    const revealTriggers = gsap.utils.toArray('.reveal-trigger');
    if (revealTriggers.length > 0) {
        revealTriggers.forEach(elem => {
            gsap.from(elem, {
                scrollTrigger: {
                    trigger: elem,
                    start: "top 85%",
                },
                y: 50,
                opacity: 0,
                duration: 1.2,
                ease: "power3.out"
            });
        });
    }

    // --- 7. NAVBAR LINKS ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                lenis.scrollTo(targetElement);
            }
        });
    });
}

// Initialize page if preloader is already hidden
if (preloader && preloader.style.display === 'none') {
    initializePage();
}
