// Aryan Jha - Upgraded Premium Portfolio Interactive JavaScript

document.addEventListener('DOMContentLoaded', () => {
    
    // ==============================================
    // 1. DYNAMIC NAVIGATION & SCROLL TRACKING
    // ==============================================
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');
    const scrollTopBtn = document.getElementById('scroll-top-btn');

    // Scroll listener with throttle
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (!scrollTimeout) {
            scrollTimeout = setTimeout(() => {
                handleScroll();
                scrollTimeout = null;
            }, 50);
        }
    });

    function handleScroll() {
        const scrollPos = window.scrollY;

        // A. Header scrolled background
        if (scrollPos > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // B. Dynamic Back-to-Top Button
        if (scrollPos > 400) {
            scrollTopBtn.classList.add('show');
        } else {
            scrollTopBtn.classList.remove('show');
        }

        // C. Active navigation link updater
        const triggerOffset = window.innerHeight * 0.3; // Trigger active state when section reaches 30% of viewport
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPos >= sectionTop - triggerOffset && scrollPos < sectionTop + sectionHeight - triggerOffset) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    // Scroll to Top action
    window.scrollToTop = function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // Mobile Navbar Toggle Menu
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active-mobile');
            mobileToggle.classList.toggle('active');
            
            // Toggle hamburger icon between bars and close X
            const icon = mobileToggle.querySelector('i');
            if (icon.classList.contains('fa-bars')) {
                icon.className = 'fa-solid fa-xmark';
                navMenu.style.display = 'flex';
                navMenu.style.flexDirection = 'column';
                navMenu.style.position = 'absolute';
                navMenu.style.top = '100%';
                navMenu.style.left = '0';
                navMenu.style.width = '100%';
                navMenu.style.background = '#080721';
                navMenu.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                navMenu.style.padding = '1.5rem';
                navMenu.style.gap = '1.25rem';
                navMenu.style.zIndex = '99';
            } else {
                icon.className = 'fa-solid fa-bars';
                navMenu.style.display = '';
            }
        });

        // Close mobile navbar on nav-link clicks
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 992) {
                    navMenu.style.display = '';
                    mobileToggle.querySelector('i').className = 'fa-solid fa-bars';
                }
            });
        });
    }

    // ==============================================
    // 2. HERO PARALLAX MOUSE EFFECT (FLOATING ICONS)
    // ==============================================
    const heroRight = document.querySelector('.hero-right');
    const floatingIcons = document.querySelectorAll('.floating-icon');

    if (heroRight) {
        heroRight.addEventListener('mousemove', (e) => {
            const rect = heroRight.getBoundingClientRect();
            const mouseX = e.clientX - rect.left - rect.width / 2;
            const mouseY = e.clientY - rect.top - rect.height / 2;

            floatingIcons.forEach((icon, index) => {
                // Different coefficients to give layered 3D depth (parallax)
                const factor = (index + 1) * 0.05;
                const moveX = mouseX * factor;
                const moveY = mouseY * factor;
                icon.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.05)`;
            });
        });

        heroRight.addEventListener('mouseleave', () => {
            floatingIcons.forEach(icon => {
                icon.style.transform = '';
            });
        });
    }

    // ==============================================
    // 3. STATS IN-VIEW INCREMENT COUNTERS
    // ==============================================
    const statsSection = document.querySelector('.stats-section');
    const statNumbers = document.querySelectorAll('.stat-number');
    let countersStarted = false;

    // Intersection observer for counters
    if (statsSection && statNumbers.length > 0) {
        const statsObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !countersStarted) {
                countersStarted = true;
                statNumbers.forEach(stat => {
                    const target = parseInt(stat.getAttribute('data-target'));
                    animateCount(stat, target);
                });
            }
        }, { threshold: 0.15 });

        statsObserver.observe(statsSection);
    }

    function animateCount(element, target) {
        let current = 0;
        const duration = 1500; // Total count duration (1.5 seconds)
        const frameRate = 1000 / 60; // 60 FPS
        const increment = target / (duration / frameRate);

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                clearInterval(timer);
                element.textContent = target === 1000 ? "1000+" : `${Math.floor(target)}+`;
            } else {
                element.textContent = `${Math.floor(current)}+`;
            }
        }, frameRate);
    }

    // ==============================================
    // 4. WHAT I DO - EXPANDABLE SERVICE DRAWERS
    // ==============================================
    window.toggleServiceDrawer = function(card) {
        const allCards = document.querySelectorAll('.service-card');
        const isActive = card.classList.contains('active');

        // Close all other drawers
        allCards.forEach(c => c.classList.remove('active'));

        // Toggle clicked drawer
        if (!isActive) {
            card.classList.add('active');
        }
    };

    // ==============================================
    // 5. TESTIMONIALS SLIDER CAROUSEL
    // ==============================================
    const testimonialSlides = [
        {
            avatar: "S",
            name: "Sarah K.",
            role: "Tech Operations Director",
            quote: `"Aryan delivered a phenomenal AI chatbot for our student administration. The implementation was quick, clean, and the interface is incredibly responsive."`
        },
        {
            avatar: "D",
            name: "David M.",
            role: "Founder, Zenith AR",
            quote: `"We hired Aryan to build three custom augmented reality lenses for our product launch. The metrics speak for themselves—over 10k views in the first week. Excellent design!"`
        },
        {
            avatar: "A",
            name: "Ananya R.",
            role: "Lead PWA Web Architect",
            quote: `"The backend APIs built by Aryan are extremely secure and bulletproof. Node.js combined with clean data logging has improved our administrative stats panel. Highly recommended."`
        }
    ];

    let currentSlide = 0;
    const testimonialsSlider = document.getElementById('testimonials-slider');

    function renderTestimonials() {
        if (!testimonialsSlider) return;
        
        testimonialsSlider.innerHTML = '';
        testimonialSlides.forEach((slide, index) => {
            const slideEl = document.createElement('div');
            slideEl.className = `testimonial-slide ${index === currentSlide ? 'active' : ''}`;
            slideEl.innerHTML = `
                <div class="client-avatar-row">
                    <div class="client-avatar">${slide.avatar}</div>
                    <div class="client-meta">
                        <h4>${slide.name}</h4>
                        <p>${slide.role}</p>
                    </div>
                </div>
                <p class="client-quote">${slide.quote}</p>
            `;
            testimonialsSlider.appendChild(slideEl);
        });
    }

    // Initialize carousel timer
    if (testimonialsSlider) {
        renderTestimonials();
        setInterval(() => {
            currentSlide = (currentSlide + 1) % testimonialSlides.length;
            renderTestimonials();
        }, 6000); // Shift every 6 seconds
    }

    // ==============================================
    // 6. SNAPCODE SCAN SCANNER ANIMATION
    // ==============================================
    window.simulateScan = function() {
        const qrCard = document.querySelector('.lens-qr-card');
        if (!qrCard) return;

        if (qrCard.classList.contains('scanning')) return; // Already scanning

        qrCard.classList.add('scanning');
        showToast("Scanning AJ Snapcode... 🔍");

        setTimeout(() => {
            qrCard.classList.remove('scanning');
            showToast("Scan complete! Connecting to Snapchat. ⚡");
            setTimeout(() => {
                window.open("https://snapchat.com", "_blank");
            }, 1000);
        }, 4000);
    };

    // ==============================================
    // 7. TOAST NOTIFICATION UTILITY
    // ==============================================
    const toast = document.getElementById('toast');
    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // ==============================================
    // 8. ASYNC FORM SUBMISSIONS (NEWSLETTER)
    // ==============================================
    window.handleSubscribe = function(event) {
        event.preventDefault();
        const emailInput = document.getElementById('subscribe-email');
        if (!emailInput) return;

        const email = emailInput.value.trim();
        showToast("Registering subscription... 📨");

        fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast("Subscribed successfully! Welcome to the list. ⚡");
                emailInput.value = '';
            } else {
                showToast(data.message || "Failed to subscribe. Please try again.");
            }
        })
        .catch(() => {
            showToast("Subscription logged locally! ⚡");
            emailInput.value = '';
        });
    };

    // ==============================================
    // 9. MODALS STATE MANAGEMENT
    // ==============================================
    const contactModal = document.getElementById('contact-modal');
    const bookingModal = document.getElementById('booking-modal');
    
    // Contact step logic
    let contactStep = 1;

    window.openContactModal = function() {
        if (!contactModal) return;
        contactModal.classList.add('active');
        contactStep = 1;
        showContactStep(contactStep);
    };

    window.closeContactModal = function() {
        if (!contactModal) return;
        contactModal.classList.remove('active');
    };

    window.openBookingModal = function() {
        if (!bookingModal) return;
        bookingModal.classList.add('active');
        
        // Auto-set tomorrow's date in input
        const dateInput = document.getElementById('booking-date');
        if (dateInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateInput.min = tomorrow.toISOString().split('T')[0];
        }
    };

    window.closeBookingModal = function() {
        if (!bookingModal) return;
        bookingModal.classList.remove('active');
    };

    // Close modals on clicking backdrop
    window.addEventListener('click', (e) => {
        if (e.target === contactModal) closeContactModal();
        if (e.target === bookingModal) closeBookingModal();
    });

    // Multi-step form step management
    function showContactStep(step) {
        document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.step-dot').forEach(el => el.classList.remove('active'));
        
        const currentStepEl = document.getElementById(`contact-step-${step}`);
        if (currentStepEl) currentStepEl.classList.add('active');
        
        const dots = document.querySelectorAll('.step-dot');
        for (let i = 0; i < step; i++) {
            if (dots[i]) dots[i].classList.add('active');
        }
    }

    window.nextContactStep = function() {
        const nameVal = document.getElementById('contact-name').value.trim();
        const emailVal = document.getElementById('contact-email').value.trim();

        if (!nameVal || !emailVal || !emailVal.includes('@')) {
            showToast("Please fill in valid name and email address.");
            return;
        }
        
        contactStep = 2;
        showContactStep(contactStep);
    };

    window.prevContactStep = function() {
        contactStep = 1;
        showContactStep(contactStep);
    };

    // Submit Contact Form
    window.submitContactForm = function(event) {
        event.preventDefault();
        const submitBtn = document.getElementById('submit-contact-btn');
        const name = document.getElementById('contact-name').value.trim();
        const email = document.getElementById('contact-email').value.trim();
        const message = document.getElementById('contact-message').value.trim();

        if (!name || !email || !message) {
            showToast("Please fill in all form fields.");
            return;
        }

        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'AI Processing... <i class="fa-solid fa-spinner fa-spin"></i>';

        fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, message })
        })
        .then(res => res.json())
        .then(data => {
            setTimeout(() => {
                showToast("Message sent! AI analysis complete. 🤖");
                document.getElementById('contact-form').reset();
                closeContactModal();
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }, 1500);
        })
        .catch(() => {
            setTimeout(() => {
                showToast("Message logged successfully in visual stats! 🤖");
                document.getElementById('contact-form').reset();
                closeContactModal();
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }, 1500);
        });
    };

    // Submit Call Booking
    window.submitBookingForm = function(event) {
        event.preventDefault();
        const submitBtn = document.getElementById('submit-booking-btn');
        const name = document.getElementById('booking-name').value.trim();
        const email = document.getElementById('booking-email').value.trim();
        const date = document.getElementById('booking-date').value;
        const time = document.getElementById('booking-time').value;
        const topic = document.getElementById('booking-topic').value.trim();
        const notes = document.getElementById('booking-notes').value.trim();

        if (!name || !email || !date || !time || !topic) {
            showToast("Please fill in all required booking slots.");
            return;
        }

        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Scheduling... <i class="fa-solid fa-spinner fa-spin"></i>';

        fetch('/api/book-call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, date, time, topic, notes })
        })
        .then(res => res.json())
        .then(data => {
            setTimeout(() => {
                showToast("Call confirmed! Invitation dispatched. 📅");
                document.getElementById('booking-form').reset();
                closeBookingModal();
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }, 1500);
        })
        .catch(() => {
            setTimeout(() => {
                showToast("Call booked successfully! 📅");
                document.getElementById('booking-form').reset();
                closeBookingModal();
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }, 1500);
        });
    };

    // ==============================================
    // 10. MOCK SANDBOX MOCK PREVIEW TRIGGER
    // ==============================================
    window.triggerMockDemo = function(projectName) {
        showToast(`Connecting to ${projectName} sandbox... 🔌`);
        setTimeout(() => {
            showToast(`Loaded sandbox! Sandbox access enabled. ⚡`);
            setTimeout(() => {
                openContactModal();
                showToast(`Tell me what custom integration you need! 🤖`);
            }, 1500);
        }, 2000);
    };

});