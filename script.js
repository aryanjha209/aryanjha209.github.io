document.addEventListener('DOMContentLoaded', () => {
    // 1. Loader Logic
    const loader = document.getElementById('loader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 600);
        }, 800);
    });

    // 2. Typing Animation
    const typingText = document.querySelector('.typing-text');
    const roles = ['AI/ML Engineer', 'Web Developer', 'Python Enthusiast', 'Cloud Architect', 'Generative AI Developer'];
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;

    function type() {
        const currentRole = roles[roleIndex];
        if (isDeleting) {
            typingText.textContent = currentRole.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 50;
        } else {
            typingText.textContent = currentRole.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 150;
        }

        if (!isDeleting && charIndex === currentRole.length) {
            isDeleting = true;
            typeSpeed = 2000;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
            typeSpeed = 500;
        }

        setTimeout(type, typeSpeed);
    }
    type();

    // 3. Mobile Menu Logic
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-links li a');

    mobileMenu.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileMenu.classList.toggle('is-active');

        const bars = mobileMenu.querySelectorAll('.bar');
        if (navLinks.classList.contains('active')) {
            bars[0].style.transform = 'rotate(-45deg) translate(-5px, 6px)';
            bars[1].style.opacity = '0';
            bars[2].style.transform = 'rotate(45deg) translate(-5px, -6px)';
        } else {
            bars[0].style.transform = 'none';
            bars[1].style.opacity = '1';
            bars[2].style.transform = 'none';
        }
    });

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navLinks.classList.remove('active');
            mobileMenu.classList.remove('is-active');
            const bars = mobileMenu.querySelectorAll('.bar');
            bars[0].style.transform = 'none';
            bars[1].style.opacity = '1';
            bars[2].style.transform = 'none';
        });
    });

    // 4. Scroll Reveal Logic
    const reveals = document.querySelectorAll('.reveal, .project-card, .skill-category, .stat-card, .exp-card');
    const revealOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, revealOptions);

    reveals.forEach(reveal => revealObserver.observe(reveal));

    // 5. Progress Bar Animation
    const skillsSection = document.getElementById('skills');
    const progressObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progressBars = document.querySelectorAll('.progress');
                progressBars.forEach(bar => {
                    const width = bar.getAttribute('data-width');
                    bar.style.width = width;
                });
            }
        });
    }, { threshold: 0.2 });

    if (skillsSection) progressObserver.observe(skillsSection);

    // 6. Counter Animation
    const counters = document.querySelectorAll('.counter');
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = +counter.getAttribute('data-target');
                const duration = 2000;
                const increment = target / (duration / 16);

                let count = 0;
                const updateCount = () => {
                    if (count < target) {
                        count += increment;
                        counter.innerText = Math.ceil(count);
                        setTimeout(updateCount, 16);
                    } else {
                        counter.innerText = target;
                    }
                };
                updateCount();
                counterObserver.unobserve(counter);
            }
        });
    }, { threshold: 1 });

    counters.forEach(counter => counterObserver.observe(counter));

    // 7. Scroll Progress & Sticky Navbar Logic
    const scrollProgress = document.getElementById('scroll-progress');
    const scrollTopBtn = document.getElementById('scroll-top');
    const navbar = document.querySelector('.navbar-container');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        // Scroll Progress
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (window.scrollY / totalHeight) * 100;
        scrollProgress.style.width = progress + '%';

        // Show/Hide Scroll Top Button
        if (window.scrollY > 500) {
            scrollTopBtn.classList.add('show');
        } else {
            scrollTopBtn.classList.remove('show');
        }

        // Hide/Show Navbar on Scroll
        if (window.scrollY > 100) {
            if (window.scrollY > lastScrollY) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
                navbar.style.background = 'rgba(15, 23, 42, 0.9)';
            }
        } else {
            navbar.style.background = 'rgba(15, 23, 42, 0.1)';
        }
        lastScrollY = window.scrollY;

        // Active Link Highlight
        const sections = document.querySelectorAll('section');
        let current = "";
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.pageYOffset >= sectionTop - 150) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${current}`) {
                item.classList.add('active');
            }
        });
    });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 8. Custom Cursor Logic
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');

    document.addEventListener('mousemove', (e) => {
        cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;

        setTimeout(() => {
            follower.style.transform = `translate3d(${e.clientX - 20}px, ${e.clientY - 20}px, 0)`;
        }, 50);
    });

    document.querySelectorAll('a, button, .menu-toggle, .project-card, .skill-category, .stat-card').forEach(element => {
        element.addEventListener('mouseenter', () => {
            cursor.style.transform += ' scale(2.5)';
            follower.style.transform += ' scale(1.5)';
            follower.style.background = 'rgba(99, 102, 241, 0.1)';
            follower.style.borderColor = 'transparent';
        });
        element.addEventListener('mouseleave', () => {
            // Transform resets in the mousemove listener
            follower.style.background = 'transparent';
            follower.style.borderColor = 'var(--primary-color)';
        });
    });

    // 9. Particle Background Logic (Advanced)
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    const mouse = { x: null, y: null, radius: 150 };

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
    });

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1;
            this.baseX = this.x;
            this.baseY = this.y;
            this.density = (Math.random() * 30) + 1;
            this.speedX = (Math.random() - 0.5) * 0.8;
            this.speedY = (Math.random() - 0.5) * 0.8;
            this.opacity = Math.random() * 0.5 + 0.2;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(99, 102, 241, ${this.opacity})`;
            ctx.fill();
        }

        update() {
            // Movement
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;

            // Mouse Interaction
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < mouse.radius) {
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const force = (mouse.radius - distance) / mouse.radius;
                const directionX = forceDirectionX * force * this.density;
                const directionY = forceDirectionY * force * this.density;

                this.x -= directionX;
                this.y -= directionY;
            }
        }
    }

    function initParticles() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        particles = [];
        const particleCount = Math.floor((canvas.width * canvas.height) / 9000);
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function connectParticles() {
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                let dx = particles[a].x - particles[b].x;
                let dy = particles[a].y - particles[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 120) {
                    ctx.strokeStyle = `rgba(99, 102, 241, ${0.2 * (1 - distance / 120)})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        connectParticles();
        requestAnimationFrame(animateParticles);
    }

    initParticles();
    animateParticles();
    window.addEventListener('resize', initParticles);

    // 10. 3D Tilt Effect
    const tiltElements = document.querySelectorAll('.project-card, .stat-card, .skill-category, .img-box, .exp-card');

    tiltElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;

            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        });

        el.addEventListener('mouseleave', () => {
            el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        });
    });

    // 11. Magnetic Button Effect
    const magneticBtns = document.querySelectorAll('.btn, .social-hero a, .logo a');

    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = `translate(0px, 0px)`;
        });
    });

    // 12. Contact Form Logic (Integrated with Backend)
    const contactForm = document.getElementById('contact-form');
    const formMsg = document.getElementById('form-msg');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('.submit-btn');
            const originalText = submitBtn.innerHTML;

            // Get form data
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

            try {
                // Try localhost first, then fall back to relative path if hosted
                const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'http://localhost:5000/api/contact'
                    : '/api/contact';

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Server responded with ${response.status}: ${errorText}`);
                }

                const result = await response.json();

                if (result.success) {
                    submitBtn.innerHTML = '<i class="fas fa-check"></i> Sent!';
                    submitBtn.style.background = '#10b981';
                    formMsg.textContent = 'Message sent successfully!';
                    formMsg.style.color = '#10b981';
                    contactForm.reset();
                } else {
                    throw new Error(result.message || 'Failed to send');
                }
            } catch (error) {
                console.error('Contact Form Error:', error);
                submitBtn.innerHTML = '<i class="fas fa-times"></i> Error';
                submitBtn.style.background = '#ef4444';
                formMsg.textContent = 'Connection error. Make sure server.js is running!';
                formMsg.style.color = '#ef4444';
                alert('Could not connect to the mail server. Please ensure node server.js is running on your PC.');
            } finally {
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.background = '';
                    setTimeout(() => {
                        formMsg.textContent = '';
                    }, 3000);
                }, 3000);
            }
        });
    }
});
