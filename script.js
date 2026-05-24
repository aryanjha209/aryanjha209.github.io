document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIGURATION & STATE ---
    // Launch Date: July 8, 2026 at 00:00:00 (IST)
    const launchDate = new Date('July 8, 2026 00:00:00').getTime();
    
    // Auto-visit tracking API URL
    // We try to auto-detect base URL (works for local and Vercel hosting)
    const apiBaseUrl = window.location.origin;

    // --- 2. OS VISITOR TRACKING API PING ---
    const trackVisitor = async () => {
        try {
            await fetch(`${apiBaseUrl}/api/visit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (err) {
            // Silence silent logger fails
            console.warn('Analytics logging is currently offline.');
        }
    };
    trackVisitor();

    // --- 3. DYNAMIC COUNTDOWN TIMER ---
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    const updateCountdown = () => {
        const now = new Date().getTime();
        const gap = launchDate - now;

        if (gap <= 0) {
            if (daysEl) daysEl.textContent = '00';
            if (hoursEl) hoursEl.textContent = '00';
            if (minutesEl) minutesEl.textContent = '00';
            if (secondsEl) secondsEl.textContent = '00';
            
            const titleEl = document.querySelector('.coming-soon-card h2');
            if (titleEl) titleEl.textContent = 'INITIALIZING SYSTEM';
            return;
        }

        // Time calculations
        const second = 1000;
        const minute = second * 60;
        const hour = minute * 60;
        const day = hour * 24;

        const d = Math.floor(gap / day);
        const h = Math.floor((gap % day) / hour);
        const m = Math.floor((gap % hour) / minute);
        const s = Math.floor((gap % minute) / second);

        // Format leading zeros
        if (daysEl) daysEl.textContent = d < 10 ? '0' + d : d;
        if (hoursEl) hoursEl.textContent = h < 10 ? '0' + h : h;
        if (minutesEl) minutesEl.textContent = m < 10 ? '0' + m : m;
        if (secondsEl) secondsEl.textContent = s < 10 ? '0' + s : s;
    };

    updateCountdown();
    setInterval(updateCountdown, 1000);

    // --- 4. HIGH-PERFORMANCE 3D SHAPES FLOATING CANVAS ---
    const canvas = document.getElementById('ambient-canvas');
    const ctx = canvas.getContext('2d');

    let shapes = [];
    const mouse = { x: null, y: null, radius: 180 };

    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Track mouse
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Handle touch movement on mobile for interactive physics
    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
        }
    });

    window.addEventListener('touchend', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // 3D-feeling Shape Class
    class GeometricShape {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.z = Math.random() * 2 + 0.5; // Depth multiplier
            this.size = (Math.random() * 30 + 15) * this.z;
            this.baseSize = this.size;
            
            // Movement parameters
            this.speedX = (Math.random() - 0.5) * 0.4 * this.z;
            this.speedY = (Math.random() - 0.5) * 0.4 * this.z;
            
            // Type of shapes: 0=Circle, 1=Square, 2=Torus, 3=Triangle
            this.type = Math.floor(Math.random() * 4);
            
            this.angle = Math.random() * Math.PI * 2;
            this.spin = (Math.random() - 0.5) * 0.005;
            
            // Coloring matching Parrot Green
            this.opacity = (Math.random() * 0.15 + 0.05) / this.z;
            this.color = `rgba(78, 191, 21, ${this.opacity})`;
            this.borderOpacity = this.opacity * 2;
            this.borderColor = `rgba(78, 191, 21, ${this.borderOpacity})`;
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.fillStyle = this.color;
            ctx.strokeStyle = this.borderColor;
            ctx.lineWidth = 1.5 * this.z;

            // Apply light shadow glows
            ctx.shadowColor = 'rgba(78, 191, 21, 0.1)';
            ctx.shadowBlur = 10 * this.z;

            ctx.beginPath();
            if (this.type === 0) {
                // Circle
                ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else if (this.type === 1) {
                // Square/Cube front
                ctx.rect(-this.size / 2, -this.size / 2, this.size, this.size);
                ctx.fill();
                ctx.stroke();
            } else if (this.type === 2) {
                // Torus/Donut
                ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(0, 0, this.size / 4, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff'; // match clean white background
                ctx.fill();
                ctx.stroke();
            } else if (this.type === 3) {
                // Triangle
                ctx.moveTo(0, -this.size / 2);
                ctx.lineTo(this.size / 2, this.size / 2);
                ctx.lineTo(-this.size / 2, this.size / 2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
            ctx.restore();
        }

        update() {
            // Normal drifting movement
            this.x += this.speedX;
            this.y += this.speedY;
            this.angle += this.spin;

            // Boundary checks
            if (this.x < -this.size) this.x = canvas.width + this.size;
            if (this.x > canvas.width + this.size) this.x = -this.size;
            if (this.y < -this.size) this.y = canvas.height + this.size;
            if (this.y > canvas.height + this.size) this.y = -this.size;

            // Cursor interaction / Parallax push
            if (mouse.x !== null && mouse.y !== null) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouse.radius) {
                    const force = (mouse.radius - distance) / mouse.radius;
                    // Push away proportional to force and shape z-depth
                    this.x -= (dx / distance) * force * 1.5 * this.z;
                    this.y -= (dy / distance) * force * 1.5 * this.z;
                    
                    // Light pulse scale effect
                    this.size = this.baseSize * (1 + force * 0.15);
                } else {
                    // Gradual spring return
                    if (this.size > this.baseSize) {
                        this.size -= 0.2;
                    }
                }
            }
        }
    }

    const initShapes = () => {
        shapes = [];
        // High density count for premium parallax effect
        const shapeCount = Math.floor((canvas.width * canvas.height) / 25000);
        const cappedCount = Math.max(15, Math.min(shapeCount, 40));
        for (let i = 0; i < cappedCount; i++) {
            shapes.push(new GeometricShape());
        }
    };

    const animateShapes = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        shapes.forEach(shape => {
            shape.update();
            shape.draw();
        });
        requestAnimationFrame(animateShapes);
    };

    initShapes();
    animateShapes();

    // --- 5. HIGH-FIDELITY 3D INTERACTIVE TILT EFFECT ---
    const card3D = document.getElementById('3d-card');

    if (card3D) {
        const handleTilt = (clientX, clientY) => {
            const rect = card3D.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            // Coordinates relative to card center
            const x = clientX - rect.left - width / 2;
            const y = clientY - rect.top - height / 2;

            // Calculate rotation percentages (max 15 degrees)
            const rotateX = (-y / (height / 2)) * 12;
            const rotateY = (x / (width / 2)) * 12;

            card3D.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        };

        const resetTilt = () => {
            card3D.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        };

        // Desktop mouse tracking
        window.addEventListener('mousemove', (e) => {
            // Dynamic check: only tilt if mouse is somewhat near the card area to keep it premium
            const rect = card3D.getBoundingClientRect();
            const buffer = 150; // trigger range buffer
            if (
                e.clientX >= rect.left - buffer &&
                e.clientX <= rect.right + buffer &&
                e.clientY >= rect.top - buffer &&
                e.clientY <= rect.bottom + buffer
            ) {
                handleTilt(e.clientX, e.clientY);
            } else {
                resetTilt();
            }
        });

        // Touch drag gestures for mobile
        card3D.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                handleTilt(e.touches[0].clientX, e.touches[0].clientY);
            }
        });

        card3D.addEventListener('touchend', resetTilt);
        card3D.addEventListener('mouseleave', resetTilt);
    }

    // --- 6. AJAX EMAIL SUBSCRIPTION HANDLER ---
    const subscribeForm = document.getElementById('subscribe-form');
    const formMsg = document.getElementById('form-msg');
    const emailInput = document.getElementById('subscriber-email');

    if (subscribeForm && formMsg && emailInput) {
        subscribeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailValue = emailInput.value.trim();
            const submitBtn = subscribeForm.querySelector('.submit-btn');
            const originalBtnHtml = submitBtn.innerHTML;

            // Set loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <span class="btn-text">Saving...</span>
                <span class="btn-icon"><i class="fas fa-spinner fa-spin"></i></span>
            `;
            
            formMsg.className = 'form-msg';
            formMsg.textContent = '';

            try {
                const response = await fetch(`${apiBaseUrl}/api/subscribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailValue })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    formMsg.textContent = result.message || 'Subscribed successfully!';
                    formMsg.classList.add('success');
                    emailInput.value = '';
                    
                    // Small visual burst confirmation
                    submitBtn.style.background = '#4EBF15';
                    submitBtn.innerHTML = `
                        <span class="btn-text">Saved!</span>
                        <span class="btn-icon"><i class="fas fa-check"></i></span>
                    `;
                } else {
                    throw new Error(result.message || 'Subscription failed.');
                }
            } catch (error) {
                console.error('Subscription error:', error);
                formMsg.textContent = error.message || 'Network error. Please try again later.';
                formMsg.classList.add('error');
                
                submitBtn.style.background = '#ef4444';
                submitBtn.innerHTML = `
                    <span class="btn-text">Error</span>
                    <span class="btn-icon"><i class="fas fa-times"></i></span>
                `;
            } finally {
                // Restore button state after a small delay
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.style.background = '';
                    submitBtn.innerHTML = originalBtnHtml;
                    
                    // Clear messages after a long delay
                    setTimeout(() => {
                        formMsg.style.opacity = '0';
                        setTimeout(() => {
                            formMsg.textContent = '';
                            formMsg.style.opacity = '1';
                        }, 300);
                    }, 4000);
                }, 2000);
            }
        });
    }
});