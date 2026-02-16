// AI-Themed Portfolio JavaScript with Advanced Animations - Fixed Version

class AIPortfolio {
    constructor() {
        this.init();
        this.particleSystem = null;
        this.matrixEffect = null;
        this.typewriterIndex = 0;
        this.typewriterTexts = [
            "AI & Machine Learning Developer",
            "Python Programming Expert", 
            "Web Technology Enthusiast",
            "Database Management Specialist",
            "Innovative Problem Solver"
        ];
        this.currentTextIndex = 0;
        this.isDeleting = false;
        this.typewriterSpeed = 100;
        this.isScrolling = false;
        
        this.observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
    }

    init() {
        this.setupEventListeners();
        this.initLoadingScreen();
        this.initParticleSystem();
        this.initMatrixEffect();
        this.initNeuralNetwork();
        this.initScrollAnimations();
        this.initNavigation();
        this.initTypewriterEffect();
        this.initSkillAnimations();
        this.initProjectAnimations();
        this.initContactForm();
        this.initCursorEffects();
        this.optimizeForMobile();
        
        // Initialize everything after a short delay
        setTimeout(() => {
            this.hideLoadingScreen();
            this.startAnimations();
        }, 2000);
    }

    setupEventListeners() {
        window.addEventListener('load', () => this.handlePageLoad());
        window.addEventListener('scroll', () => this.handleScroll());
        window.addEventListener('resize', () => this.handleResize());
        
        // Reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.disableAnimations();
        }
    }

    // Loading Screen Management
    initLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            this.animateLoadingProgress();
        }
    }

    animateLoadingProgress() {
        const nodes = document.querySelectorAll('.node');
        const connections = document.querySelectorAll('.connection');
        
        nodes.forEach((node, index) => {
            node.style.animationDelay = `${index * 0.3}s`;
        });
        
        connections.forEach((connection, index) => {
            connection.style.animationDelay = `${index * 0.5}s`;
        });
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    // Particle System
    initParticleSystem() {
        const canvas = document.getElementById('particleCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let particles = [];
        let mouseX = 0;
        let mouseY = 0;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Particle class
        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 3 + 1;
                this.speedX = (Math.random() - 0.5) * 0.5;
                this.speedY = (Math.random() - 0.5) * 0.5;
                this.color = this.getRandomColor();
                this.opacity = Math.random() * 0.5 + 0.2;
                this.pulseSpeed = Math.random() * 0.02 + 0.01;
                this.pulsePhase = Math.random() * Math.PI * 2;
            }

            getRandomColor() {
                const colors = [
                    '0, 212, 255',    // Electric blue
                    '57, 255, 20',    // Neon green
                    '157, 78, 221',   // AI purple
                    '255, 107, 53'    // AI orange
                ];
                return colors[Math.floor(Math.random() * colors.length)];
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                // Pulse effect
                this.pulsePhase += this.pulseSpeed;
                const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;
                this.currentOpacity = this.opacity * pulse;

                // Mouse interaction
                const dx = mouseX - this.x;
                const dy = mouseY - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    const force = (100 - distance) / 100;
                    this.x -= dx * force * 0.01;
                    this.y -= dy * force * 0.01;
                }

                // Boundary check
                if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
                if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;

                // Keep particles in bounds
                this.x = Math.max(0, Math.min(canvas.width, this.x));
                this.y = Math.max(0, Math.min(canvas.height, this.y));
            }

            draw() {
                ctx.save();
                ctx.globalAlpha = this.currentOpacity;
                ctx.fillStyle = `rgba(${this.color}, 1)`;
                ctx.shadowBlur = this.size * 3;
                ctx.shadowColor = `rgba(${this.color}, 0.8)`;
                
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        // Create particles
        const particleCount = window.innerWidth <= 768 ? 25 : 50;
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        // Mouse tracking
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        });

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw connections between nearby particles
            this.drawConnections(particles, ctx);

            // Update and draw particles
            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });

            requestAnimationFrame(animate);
        };

        this.particleSystem = { animate, particles };
        animate();
    }

    drawConnections(particles, ctx) {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 150) {
                    const opacity = (150 - distance) / 150 * 0.3;
                    ctx.save();
                    ctx.globalAlpha = opacity;
                    ctx.strokeStyle = 'rgba(0, 212, 255, 1)';
                    ctx.lineWidth = 1;
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = 'rgba(0, 212, 255, 0.5)';
                    
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }
    }

    // Matrix Rain Effect
    initMatrixEffect() {
        const matrixBg = document.getElementById('matrixBg');
        if (!matrixBg) return;

        const characters = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        let matrixColumns = Math.floor(window.innerWidth / 20);

        const createMatrixRain = () => {
            matrixBg.innerHTML = '';
            
            for (let i = 0; i < Math.min(matrixColumns, 40); i++) {
                const column = document.createElement('div');
                column.style.position = 'absolute';
                column.style.left = i * 20 + 'px';
                column.style.fontSize = '14px';
                column.style.color = 'rgba(57, 255, 20, 0.8)';
                column.style.textShadow = '0 0 5px rgba(57, 255, 20, 0.5)';
                column.style.fontFamily = 'Fira Code, monospace';
                column.style.animation = `matrixDrop ${2 + Math.random() * 3}s linear infinite`;
                column.style.animationDelay = `${Math.random() * 2}s`;
                
                let columnText = '';
                for (let j = 0; j < Math.floor(Math.random() * 15) + 5; j++) {
                    columnText += characters.charAt(Math.floor(Math.random() * characters.length)) + '<br>';
                }
                
                column.innerHTML = columnText;
                matrixBg.appendChild(column);
            }
        };

        // Add CSS animation for matrix drop
        const style = document.createElement('style');
        style.textContent = `
            @keyframes matrixDrop {
                0% { transform: translateY(-100vh); opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateY(100vh); opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        createMatrixRain();
        
        // Recreate matrix rain every 10 seconds
        setInterval(createMatrixRain, 10000);

        this.matrixEffect = { createMatrixRain };
    }

    // Neural Network Background
    initNeuralNetwork() {
        const neuralBg = document.getElementById('neuralBg');
        if (!neuralBg) return;

        // Create animated neural network nodes
        const createNeuralNodes = () => {
            for (let i = 0; i < 8; i++) {
                const node = document.createElement('div');
                node.className = 'neural-node';
                node.style.position = 'absolute';
                node.style.width = '4px';
                node.style.height = '4px';
                node.style.background = 'rgba(0, 212, 255, 0.6)';
                node.style.borderRadius = '50%';
                node.style.boxShadow = '0 0 10px rgba(0, 212, 255, 0.6)';
                node.style.left = Math.random() * 100 + '%';
                node.style.top = Math.random() * 100 + '%';
                node.style.animation = `neuralFloat ${3 + Math.random() * 4}s ease-in-out infinite`;
                node.style.animationDelay = `${Math.random() * 2}s`;
                
                neuralBg.appendChild(node);
            }
        };

        const style = document.createElement('style');
        style.textContent = `
            @keyframes neuralFloat {
                0%, 100% { transform: translate(0, 0); opacity: 0.3; }
                50% { transform: translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px); opacity: 0.8; }
            }
        `;
        document.head.appendChild(style);

        createNeuralNodes();
    }

    // Enhanced Typewriter Effect
    initTypewriterEffect() {
        const typewriterElement = document.getElementById('typewriter');
        if (!typewriterElement) return;

        const typeText = () => {
            const currentText = this.typewriterTexts[this.currentTextIndex];
            
            if (this.isDeleting) {
                typewriterElement.textContent = currentText.substring(0, this.typewriterIndex - 1);
                this.typewriterIndex--;
                
                if (this.typewriterIndex === 0) {
                    this.isDeleting = false;
                    this.currentTextIndex = (this.currentTextIndex + 1) % this.typewriterTexts.length;
                    setTimeout(typeText, 500);
                    return;
                }
            } else {
                typewriterElement.textContent = currentText.substring(0, this.typewriterIndex + 1);
                this.typewriterIndex++;
                
                if (this.typewriterIndex === currentText.length) {
                    setTimeout(() => {
                        this.isDeleting = true;
                        typeText();
                    }, 2000);
                    return;
                }
            }
            
            const speed = this.isDeleting ? 50 : this.typewriterSpeed;
            setTimeout(typeText, speed + Math.random() * 50);
        };

        setTimeout(typeText, 1000);
    }

    // Enhanced Navigation with Fixed Scroll
    initNavigation() {
        const nav = document.getElementById('navbar');
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        const navLinks = document.querySelectorAll('.nav__link');

        // Mobile navigation toggle - FIXED
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', (e) => {
                e.preventDefault();
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
        }

        // Enhanced smooth scrolling with fixed navigation - FIXED
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Close mobile menu
                navMenu?.classList.remove('active');
                navToggle?.classList.remove('active');
                
                const targetId = link.getAttribute('href');
                if (targetId && targetId.startsWith('#')) {
                    this.smoothScrollToSection(targetId);
                }
            });
        });

        // Update active navigation link on scroll
        this.updateActiveNavLink();
    }

    // Enhanced smooth scroll function - FIXED
    smoothScrollToSection(targetId) {
        const targetElement = document.querySelector(targetId);
        if (!targetElement) return;

        this.isScrolling = true;
        const headerHeight = document.getElementById('navbar')?.offsetHeight || 70;
        const targetPosition = targetElement.offsetTop - headerHeight - 20;

        // Smooth scroll with custom easing
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = 800;
        let startTime = null;

        const ease = (t) => {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        };

        const animation = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            
            window.scrollTo(0, startPosition + distance * ease(progress));
            
            if (progress < 1) {
                requestAnimationFrame(animation);
            } else {
                this.isScrolling = false;
            }
        };

        requestAnimationFrame(animation);
    }

    // Fixed active navigation link update
    updateActiveNavLink() {
        if (this.isScrolling) return; // Don't update while programmatically scrolling

        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav__link');
        const scrollPos = window.scrollY + 120;

        let activeSection = null;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                activeSection = section.getAttribute('id');
            }
        });

        // Update active class
        navLinks.forEach(link => {
            link.classList.remove('active');
            const linkHref = link.getAttribute('href');
            if (linkHref === `#${activeSection}`) {
                link.classList.add('active');
            }
        });
    }

    // Scroll Animations
    initScrollAnimations() {
        const observerCallback = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    
                    // Trigger specific animations based on element type
                    if (entry.target.classList.contains('skill-category')) {
                        this.animateSkillProgress(entry.target);
                    }
                    
                    if (entry.target.classList.contains('timeline-item')) {
                        this.animateTimelineItem(entry.target);
                    }
                    
                    if (entry.target.classList.contains('cert-item')) {
                        this.animateCertificationBadge(entry.target);
                    }
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, this.observerOptions);

        // Observe elements for animation
        const elementsToAnimate = document.querySelectorAll(`
            .skill-category, 
            .project-card, 
            .timeline-item, 
            .cert-item, 
            .workshop-item, 
            .contact-item,
            .about__text
        `);

        elementsToAnimate.forEach(element => {
            observer.observe(element);
        });
    }

    // Skill Animations
    initSkillAnimations() {
        const skillCategories = document.querySelectorAll('.skill-category');
        
        skillCategories.forEach((category, index) => {
            category.style.animationDelay = `${index * 0.2}s`;
            
            // Add hover effects for skill tags
            const skillTags = category.querySelectorAll('.skill-tag');
            skillTags.forEach(tag => {
                this.addRippleEffect(tag);
            });
        });
    }

    animateSkillProgress(skillCategory) {
        const progressBar = skillCategory.querySelector('.progress-bar');
        const progress = progressBar?.getAttribute('data-progress');
        
        if (progressBar && progress) {
            setTimeout(() => {
                progressBar.style.width = progress + '%';
            }, 500);
        }
    }

    addRippleEffect(element) {
        element.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple-effect');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    }

    // Enhanced Project Animations - FIXED
    initProjectAnimations() {
        const projectCards = document.querySelectorAll('.project-card');
        
        projectCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.3}s`;
            
            // Enhanced 3D hover effect for desktop - FIXED
            if (window.innerWidth > 768) {
                this.init3DHoverEffect(card);
            } else {
                // Mobile click to flip functionality
                this.initMobileFlipEffect(card);
            }
        });
    }

    // Fixed 3D hover effect
    init3DHoverEffect(card) {
        const inner = card.querySelector('.project-card__inner');
        if (!inner) return;

        card.addEventListener('mouseenter', () => {
            inner.style.transform = 'rotateY(180deg)';
        });

        card.addEventListener('mouseleave', () => {
            inner.style.transform = 'rotateY(0deg)';
        });

        // Add perspective and smooth transition
        card.style.perspective = '1000px';
        inner.style.transformStyle = 'preserve-3d';
        inner.style.transition = 'transform 0.8s ease-in-out';
    }

    // Mobile flip effect
    initMobileFlipEffect(card) {
        const inner = card.querySelector('.project-card__inner');
        if (!inner) return;

        let isFlipped = false;

        card.addEventListener('click', () => {
            isFlipped = !isFlipped;
            inner.style.transform = isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)';
        });

        // Set up mobile styles
        card.style.perspective = '1000px';
        inner.style.transformStyle = 'preserve-3d';
        inner.style.transition = 'transform 0.8s ease-in-out';
    }

    // Timeline Animations
    animateTimelineItem(timelineItem) {
        timelineItem.style.opacity = '1';
        timelineItem.style.transform = 'translateX(0)';
        
        const marker = timelineItem.querySelector('.timeline-marker');
        if (marker) {
            marker.style.animation = 'markerPulse 2s infinite';
        }
    }

    // Certification Badge Animation
    animateCertificationBadge(certItem) {
        const badge = certItem.querySelector('.cert-badge');
        if (badge) {
            badge.style.animation = 'badgePulse 2s infinite';
        }
    }

    // Enhanced Contact Form
    initContactForm() {
        const contactForm = document.getElementById('contact-form');
        if (!contactForm) return;

        const inputs = contactForm.querySelectorAll('.neon-input');
        
        // Add focus effects
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                this.addInputFocusEffect(input);
            });
            
            input.addEventListener('blur', () => {
                this.removeInputFocusEffect(input);
            });

            // Add typing effect
            input.addEventListener('input', () => {
                this.addInputTypingEffect(input);
            });
        });

        // Form submission
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Contact form submitted!');
            this.handleFormSubmission(contactForm);
        });
    }

    addInputFocusEffect(input) {
        input.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.4)';
        input.style.borderColor = 'rgba(0, 212, 255, 1)';
    }

    removeInputFocusEffect(input) {
        if (input.value === '') {
            input.style.boxShadow = 'none';
            input.style.borderColor = 'rgba(0, 212, 255, 0.3)';
        }
    }

    addInputTypingEffect(input) {
        // Add a subtle glow while typing
        input.style.boxShadow = '0 0 15px rgba(57, 255, 20, 0.2)';
        
        // Remove the effect after a short delay
        clearTimeout(input.typingTimeout);
        input.typingTimeout = setTimeout(() => {
            if (document.activeElement !== input) {
                input.style.boxShadow = 'none';
            }
        }, 1000);
    }

    handleFormSubmission(form) {
        const formData = new FormData(form);
        const name = formData.get('name');
        const email = formData.get('email');
        const message = formData.get('message');

        // Validation
        if (!this.validateForm(name, email, message)) {
            return;
        }

        // Show AI processing animation
        this.showAIProcessingAnimation(form);

        // Send form data to backend for emailing
        fetch('/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                email,
                message,
                to: 'aryankjhaa@gmail.com' // updated email address
            })
        })
        .then(response => response.json())
        .then(data => {
            setTimeout(() => {
                if (data.success) {
                    this.showSuccessMessage();
                } else {
                    this.showNotification('Sorry, your message could not be sent. Please check your internet connection or try again later.', 'error');
                }
                form.reset();
                this.resetFormStyles(form);
            }, 2000);
        })
        .catch(() => {
            setTimeout(() => {
                this.showNotification('Sorry, your message could not be sent. Please check your internet connection or try again later.', 'error');
                form.reset();
                this.resetFormStyles(form);
            }, 2000);
        });
    }

    validateForm(name, email, message) {
        if (!name || !email || !message) {
            this.showNotification('Please fill in all fields.', 'error');
            return false;
        }
        
        if (!this.isValidEmail(email)) {
            this.showNotification('Please enter a valid email address.', 'error');
            return false;
        }
        
        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    resetFormStyles(form) {
        const inputs = form.querySelectorAll('.neon-input');
        inputs.forEach(input => {
            input.style.boxShadow = 'none';
            input.style.borderColor = 'rgba(0, 212, 255, 0.3)';
        });
    }

    showAIProcessingAnimation(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = `
            <span class="processing-text">AI Processing...</span>
            <div class="processing-dots">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        `;
        submitBtn.disabled = true;
        
        // Add processing animation styles if not already added
        if (!document.querySelector('style[data-processing-animation]')) {
            const style = document.createElement('style');
            style.setAttribute('data-processing-animation', 'true');
            style.textContent = `
                .processing-dots {
                    display: inline-flex;
                    gap: 4px;
                    margin-left: 8px;
                }
                .dot {
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    background: currentColor;
                    animation: dotPulse 1.4s ease-in-out infinite both;
                }
                .dot:nth-child(1) { animation-delay: -0.32s; }
                .dot:nth-child(2) { animation-delay: -0.16s; }
                .dot:nth-child(3) { animation-delay: 0s; }
                @keyframes dotPulse {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 2000);
    }

    showSuccessMessage() {
        this.showNotification('Message sent successfully! AI analysis complete. 🤖', 'success');
    }

    showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.ai-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `ai-notification ai-notification--${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${this.getNotificationIcon(type)}</div>
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add notification styles if not already added
        if (!document.querySelector('style[data-notification]')) {
            const style = document.createElement('style');
            style.setAttribute('data-notification', 'true');
            style.textContent = `
                .ai-notification {
                    position: fixed;
                    top: 90px;
                    right: 20px;
                    background: rgba(26, 27, 58, 0.95);
                    border: 1px solid rgba(0, 212, 255, 0.3);
                    border-radius: 12px;
                    padding: 16px 20px;
                    box-shadow: 0 8px 30px rgba(0, 212, 255, 0.2);
                    z-index: 1001;
                    max-width: 400px;
                    backdrop-filter: blur(10px);
                    animation: slideInRight 0.3s ease-out;
                }
                .ai-notification--success {
                    border-color: rgba(57, 255, 20, 0.5);
                    box-shadow: 0 8px 30px rgba(57, 255, 20, 0.2);
                }
                .ai-notification--error {
                    border-color: rgba(255, 107, 53, 0.5);
                    box-shadow: 0 8px 30px rgba(255, 107, 53, 0.2);
                }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: white;
                }
                .notification-icon {
                    font-size: 20px;
                }
                .notification-message {
                    flex: 1;
                    font-size: 14px;
                    line-height: 1.4;
                }
                .notification-close {
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s ease;
                }
                .notification-close:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @media (max-width: 768px) {
                    .ai-notification {
                        right: 16px;
                        left: 16px;
                        max-width: none;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Close button functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        });

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideInRight 0.3s ease-out reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: '🤖',
            error: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    // Enhanced Cursor Effects
    initCursorEffects() {
        if (window.innerWidth <= 768) return; // Skip on mobile

        const cursor = document.createElement('div');
        cursor.className = 'ai-cursor';
        cursor.innerHTML = '<div class="cursor-core"></div><div class="cursor-glow"></div>';
        document.body.appendChild(cursor);

        const style = document.createElement('style');
        style.textContent = `
            .ai-cursor {
                position: fixed;
                width: 20px;
                height: 20px;
                pointer-events: none;
                z-index: 9999;
                mix-blend-mode: difference;
                transition: transform 0.1s ease;
            }
            .cursor-core {
                width: 8px;
                height: 8px;
                background: rgba(0, 212, 255, 1);
                border-radius: 50%;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }
            .cursor-glow {
                width: 20px;
                height: 20px;
                border: 1px solid rgba(0, 212, 255, 0.3);
                border-radius: 50%;
                position: absolute;
                top: 0;
                left: 0;
                animation: cursorGlow 2s infinite;
            }
            @keyframes cursorGlow {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.7; }
            }
            body * {
                cursor: none !important;
            }
        `;
        document.head.appendChild(style);

        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX - 10 + 'px';
            cursor.style.top = e.clientY - 10 + 'px';
        });

        // Cursor interaction with clickable elements
        const clickableElements = document.querySelectorAll('a, button, .skill-tag, .project-card, .nav__link');
        clickableElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                cursor.style.transform = 'scale(1.5)';
            });
            element.addEventListener('mouseleave', () => {
                cursor.style.transform = 'scale(1)';
            });
        });
    }

    // Mobile Optimization
    optimizeForMobile() {
        if (window.innerWidth <= 768) {
            // Reduce animations for better performance on mobile
            const heavyAnimations = document.querySelectorAll('.floating-shape');
            heavyAnimations.forEach(element => {
                element.style.animation = 'none';
            });
        }
    }

    // Scroll Handler with throttling
    handleScroll() {
        this.throttle(() => {
            this.updateActiveNavLink();
            this.updateNavBackground();
        }, 16);
    }

    updateNavBackground() {
        const nav = document.getElementById('navbar');
        if (window.scrollY > 50) {
            nav?.classList.add('scrolled');
        } else {
            nav?.classList.remove('scrolled');
        }
    }

    // Resize Handler
    handleResize() {
        this.throttle(() => {
            // Recalculate particle system
            if (this.particleSystem) {
                const canvas = document.getElementById('particleCanvas');
                if (canvas) {
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                }
            }

            // Update matrix effect
            if (this.matrixEffect) {
                this.matrixEffect.createMatrixRain();
            }

            // Re-initialize cursor effects for desktop/mobile
            const existingCursor = document.querySelector('.ai-cursor');
            if (existingCursor) {
                existingCursor.remove();
            }
            this.initCursorEffects();
        }, 250);
    }

    // Page Load Handler
    handlePageLoad() {
        console.log('AI Portfolio loaded successfully! 🤖');
    }

    // Start Animations
    startAnimations() {
        // Add initial animation class to elements
        const animatedElements = document.querySelectorAll('.hero__content, .section__title');
        animatedElements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add('animate-in');
            }, index * 200);
        });
    }

    // Disable Animations (for reduced motion preference)
    disableAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Utility function for throttling
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }
}

// Initialize the AI Portfolio when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AIPortfolio();
});

// Add global animation styles
const globalAnimationStyles = document.createElement('style');
globalAnimationStyles.textContent = `
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
    
    .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    /* Performance optimization */
    .bg-effects, .floating-shape, #particleCanvas {
        will-change: transform, opacity;
        backface-visibility: hidden;
        perspective: 1000px;
    }
    
    /* Smooth transitions for all interactive elements */
    .btn, .nav__link, .skill-tag, .project-card, .contact-item {
        will-change: transform;
        backface-visibility: hidden;
    }
    
    /* Enhanced 3D card flip styles */
    .project-card__inner {
        position: relative;
        width: 100%;
        height: 100%;
        text-align: center;
        transition: transform 0.8s ease-in-out;
        transform-style: preserve-3d;
    }
    
    .project-card__front,
    .project-card__back {
        position: absolute;
        width: 100%;
        height: 100%;
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
        border-radius: 16px;
        padding: 30px;
        display: flex;
        flex-direction: column;
    }
    
    .project-card__back {
        transform: rotateY(180deg);
        justify-content: center;
    }
`;

document.head.appendChild(globalAnimationStyles);