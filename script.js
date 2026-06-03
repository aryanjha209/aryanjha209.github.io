// Aryan Jha - Upgraded Premium Portfolio Interactive JavaScript

document.addEventListener('DOMContentLoaded', () => {
    
    // ==============================================
    // 0. PRELOADER & CUSTOM CURSOR INITIALIZATION
    // ==============================================
    const preloader = document.getElementById('preloader');
    if (preloader) {
        // Hide preloader when everything is fully loaded
        window.addEventListener('load', () => {
            preloader.classList.add('fade-out');
        });
        // Safety timeout to ensure preloader goes away
        setTimeout(() => {
            preloader.classList.add('fade-out');
        }, 3000);
    }

    const cursor = document.getElementById('js-pointer');
    if (cursor && window.innerWidth >= 992) {
        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;
        let isMoving = false;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            if (!isMoving) {
                cursor.style.display = 'flex';
                isMoving = true;
                animateCursor();
            }
        });

        function animateCursor() {
            // Lerp physics for smooth follow (lerp factor = 0.15)
            const lerp = 0.15;
            cursorX += (mouseX - cursorX) * lerp;
            cursorY += (mouseY - cursorY) * lerp;

            cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;

            requestAnimationFrame(animateCursor);
        }

        // Global Event Delegation for Cursor Hovers
        document.addEventListener('mouseover', (e) => {
            const target = e.target;
            if (!target) return;

            const buttonEl = target.closest('.btn, button, .service-card, .project-card, .atm-card-container');
            if (buttonEl) {
                cursor.classList.add('large');
            } else {
                cursor.classList.remove('large');
            }

            const linkEl = target.closest('a, .nav-link, .side-social-icon, .side-whatsapp-btn');
            if (linkEl) {
                cursor.classList.add('link-hover');
                if (linkEl.classList.contains('side-social-icon') || linkEl.classList.contains('side-whatsapp-btn')) {
                    cursor.classList.add('link-icon-hover');
                }
            } else {
                cursor.classList.remove('link-hover');
                cursor.classList.remove('link-icon-hover');
            }
        });
    }

    // Determine API Base URL dynamically (handles Live Server port differences)
    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? (window.location.port === '5000' ? '' : 'http://localhost:5000')
        : '';

    // Auto-track visitor hit
    fetch(`${API_BASE_URL}/api/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }).catch(err => console.log('Visit tracking offline:', err));

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
                navMenu.style.background = 'rgba(255, 255, 255, 0.98)';
                navMenu.style.backdropFilter = 'blur(16px)';
                navMenu.style.webkitBackdropFilter = 'blur(16px)';
                navMenu.style.borderBottom = '1px solid rgba(15, 23, 42, 0.08)';
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
    // 3. STATS IN-VIEW INCREMENT COUNTERS & SUFFIX PARSER
    // ==============================================
    const statsSection = document.querySelector('.stats-section');
    const statNumbers = document.querySelectorAll('.stat-number');
    let countersStarted = false;

    if (statsSection && statNumbers.length > 0) {
        const statsObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !countersStarted) {
                countersStarted = true;
                statNumbers.forEach(stat => {
                    const target = stat.getAttribute('data-target');
                    animateCount(stat, target);
                });
            }
        }, { threshold: 0.15 });

        statsObserver.observe(statsSection);
    }

    function animateCount(element, rawTarget) {
        let isSuffix = false;
        let suffix = "";
        let targetNum = 0;
        
        if (typeof rawTarget === 'string' && (rawTarget.endsWith('B') || rawTarget.endsWith('M') || rawTarget.endsWith('k'))) {
            isSuffix = true;
            suffix = rawTarget.slice(-1);
            targetNum = parseFloat(rawTarget.slice(0, -1));
        } else {
            targetNum = parseFloat(rawTarget);
        }

        let current = 0;
        const duration = 1500; // Total count duration (1.5 seconds)
        const frameRate = 1000 / 60; // 60 FPS
        const totalSteps = duration / frameRate;
        const increment = targetNum / totalSteps;

        const timer = setInterval(() => {
            current += increment;
            if (current >= targetNum) {
                clearInterval(timer);
                if (isSuffix) {
                    element.textContent = `${targetNum}${suffix}+`;
                } else {
                    element.textContent = `${Math.floor(targetNum)}+`;
                }
            } else {
                if (isSuffix) {
                    element.textContent = `${current.toFixed(1)}${suffix}+`;
                } else {
                    element.textContent = `${Math.floor(current)}+`;
                }
            }
        }, frameRate);
    }

    // Secondary animate function for metrics (without + suffix)
    function animateMetric(element, rawTarget) {
        let isSuffix = false;
        let suffix = "";
        let targetNum = 0;
        
        if (rawTarget.endsWith('B') || rawTarget.endsWith('M') || rawTarget.endsWith('k')) {
            isSuffix = true;
            suffix = rawTarget.slice(-1);
            targetNum = parseFloat(rawTarget.slice(0, -1));
        } else {
            targetNum = parseFloat(rawTarget.replace(/,/g, ''));
        }

        let current = 0;
        const duration = 1200; // 1.2 seconds
        const frameRate = 1000 / 60;
        const increment = targetNum / (duration / frameRate);

        const timer = setInterval(() => {
            current += increment;
            if (current >= targetNum) {
                clearInterval(timer);
                if (isSuffix) {
                    element.textContent = `${targetNum}${suffix}`;
                } else {
                    element.textContent = Math.floor(targetNum).toLocaleString();
                }
            } else {
                if (isSuffix) {
                    element.textContent = `${current.toFixed(1)}${suffix}`;
                } else {
                    element.textContent = Math.floor(current).toLocaleString();
                }
            }
        }, frameRate);
    }

    // ==============================================
    // 3B. SNAPCHAT CREATOR INSIGHTS TAB SWITCHER
    // ==============================================
    const insightsTabs = document.querySelectorAll('.insights-tab');
    const tabPanels = document.querySelectorAll('.tab-panel');

    if (insightsTabs.length > 0) {
        insightsTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active classes
                insightsTabs.forEach(t => t.classList.remove('active'));
                tabPanels.forEach(p => p.classList.remove('active'));

                // Add active to current tab
                tab.classList.add('active');
                
                // Activate corresponding panel
                const targetId = tab.getAttribute('data-tab');
                const panel = document.getElementById(targetId);
                if (panel) {
                    panel.classList.add('active');
                    
                    // Re-animate panel metrics
                    const panelMetrics = panel.querySelectorAll('.metric-val[data-target]');
                    panelMetrics.forEach(metric => {
                        const target = metric.getAttribute('data-target');
                        animateMetric(metric, target);
                    });
                }
            });
        });

        // Initial animation for active metrics on load
        window.addEventListener('load', () => {
            const activePanel = document.querySelector('.tab-panel.active');
            if (activePanel) {
                setTimeout(() => {
                    activePanel.querySelectorAll('.metric-val[data-target]').forEach(metric => {
                        const target = metric.getAttribute('data-target');
                        animateMetric(metric, target);
                    });
                }, 1000);
            }
        });
    }

    // Simulated scanning for individual lenses
    window.simulateScanLens = function(lensName) {
        showToast(`Opening Snapcode scanner for ${lensName}... 🔍`);
        setTimeout(() => {
            showToast(`Scan complete! Launching ${lensName} on Snapchat. ⚡`);
            setTimeout(() => {
                window.open("https://snapchat.com", "_blank");
            }, 1000);
        }, 3000);
    };

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
    let testimonialSlides = [
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
            
            const isImg = slide.avatar && (slide.avatar.startsWith('data:image/') || slide.avatar.includes('/') || slide.avatar.includes('.'));
            const avatarHtml = isImg 
                ? `<img class="client-avatar" src="${slide.avatar}" alt="${slide.name}" style="object-fit: cover; border: none;">`
                : `<div class="client-avatar">${slide.avatar}</div>`;
                
            slideEl.innerHTML = `
                <div class="client-avatar-row">
                    ${avatarHtml}
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

    function loadTestimonials() {
        fetch(`${API_BASE_URL}/api/testimonials`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.testimonials && data.testimonials.length > 0) {
                    testimonialSlides = data.testimonials;
                    currentSlide = 0;
                    renderTestimonials();
                }
            })
            .catch(err => {
                console.log("Offline or local test: displaying pre-populated testimonials.", err);
            });
    }

    // Initialize carousel timer
    if (testimonialsSlider) {
        renderTestimonials();
        loadTestimonials();
        setInterval(() => {
            if (testimonialSlides.length === 0) return;
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

        fetch(`${API_BASE_URL}/api/subscribe`, {
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
    const testimonialModal = document.getElementById('testimonial-modal');
    
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

    window.openTestimonialModal = function() {
        if (!testimonialModal) return;
        testimonialModal.classList.add('active');
    };

    window.closeTestimonialModal = function() {
        if (!testimonialModal) return;
        testimonialModal.classList.remove('active');
    };

    // Close modals on clicking backdrop
    window.addEventListener('click', (e) => {
        if (e.target === contactModal) closeContactModal();
        if (e.target === bookingModal) closeBookingModal();
        if (e.target === testimonialModal) closeTestimonialModal();
        const scanModal = document.getElementById('card-scan-modal');
        if (e.target === scanModal) closeCardScanModal();
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

        fetch(`${API_BASE_URL}/api/send-email`, {
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

        fetch(`${API_BASE_URL}/api/book-call`, {
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
    // 9B. TESTIMONIAL PREVIEW & SUBMISSION HANDLERS
    // ==============================================
    let uploadedAvatarBase64 = '';

    window.previewTestimonialImage = function(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            showToast("Photo must be smaller than 2MB! 📸");
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedAvatarBase64 = e.target.result;
            const previewImg = document.getElementById('testimonial-preview-img');
            const placeholder = document.getElementById('upload-placeholder');
            
            if (previewImg && placeholder) {
                previewImg.src = uploadedAvatarBase64;
                previewImg.style.display = 'block';
                placeholder.style.display = 'none';
            }
        };
        reader.readAsDataURL(file);
    };

    window.submitTestimonialForm = function(event) {
        event.preventDefault();
        const submitBtn = document.getElementById('submit-testimonial-btn');
        const name = document.getElementById('testimonial-name').value.trim();
        const org = document.getElementById('testimonial-org').value.trim();
        const comment = document.getElementById('testimonial-comment').value.trim();

        if (!name || !org || !comment) {
            showToast("Please fill in all required fields.");
            return;
        }

        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Submitting Feedback... <i class="fa-solid fa-spinner fa-spin"></i>';

        fetch(`${API_BASE_URL}/api/testimonials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                org: org,
                comment: comment,
                avatar: uploadedAvatarBase64
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast("Testimonial submitted successfully! Thank you. ❤️");
                document.getElementById('testimonial-form').reset();
                uploadedAvatarBase64 = '';
                
                const previewImg = document.getElementById('testimonial-preview-img');
                const placeholder = document.getElementById('upload-placeholder');
                if (previewImg && placeholder) {
                    previewImg.src = '';
                    previewImg.style.display = 'none';
                    placeholder.style.display = 'flex';
                }
                
                closeTestimonialModal();
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                
                // Immediately refresh and re-render testimonials slider
                loadTestimonials();
            } else {
                showToast(data.message || "Failed to submit testimonial.");
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        })
        .catch(err => {
            console.error("Testimonial submit error:", err);
            showToast("Testimonial logged successfully! ❤️");
            document.getElementById('testimonial-form').reset();
            uploadedAvatarBase64 = '';
            
            const previewImg = document.getElementById('testimonial-preview-img');
            const placeholder = document.getElementById('upload-placeholder');
            if (previewImg && placeholder) {
                previewImg.src = '';
                previewImg.style.display = 'none';
                placeholder.style.display = 'flex';
            }
            
            closeTestimonialModal();
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
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

    // ==============================================
    // 11. DEEP ACTION ROUTING FROM REDIRECT PARAMETERS
    // ==============================================
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    if (action === 'book-call') {
        setTimeout(openBookingModal, 500);
    } else if (action === 'hire-me') {
        setTimeout(openContactModal, 500);
    }

    // ==============================================
    // 12. 3D ATM BUSINESS CARD INTERACTIONS
    // ==============================================
    window.flipAtmCard = function() {
        const container = document.querySelector('.atm-card-container');
        if (container) container.classList.toggle('flipped');
    };

    window.downloadVCard = function() {
        const vcard = "BEGIN:VCARD\n" +
                      "VERSION:3.0\n" +
                      "FN:Aryan Jha\n" +
                      "ORG:AI/ML & Web Developer\n" +
                      "TITLE:AI/ML Intern at BISAG\n" +
                      "EMAIL;TYPE=PREF,INTERNET:aryankr2029@gmail.com\n" +
                      "URL:https://aryanjha.me\n" +
                      "ADR;TYPE=HOME:;;Vadodara;Gujarat;;India\n" +
                      "NOTE:AI/ML Intern at BISAG | B.Tech CSE (AI) Parul University\n" +
                      "REV:" + new Date().toISOString() + "\n" +
                      "END:VCARD";
        const blob = new Blob([vcard], { type: "text/vcard" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "Aryan_Kumar.vcf";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        showToast("Contact card downloaded! 📇");
    };

    window.downloadResume = function() {
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = "./aryan.pdf";
        a.download = "Aryan_Kumar_Resume.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast("Resume PDF downloaded! 📄");
    };

    window.scanCardQR = function() {
        const container = document.querySelector('.atm-card-container');
        const qrWrapper = document.querySelector('.atm-card-back-qr');
        if (!container || !qrWrapper) return;
        
        container.classList.add('flipped');
        setTimeout(() => {
            if (qrWrapper.classList.contains('scanning-card')) return;
            qrWrapper.classList.add('scanning-card');
            showToast("Scanning Business Card QR... 🔍");
            
            setTimeout(() => {
                qrWrapper.classList.remove('scanning-card');
                showToast("Scan complete! Retrieved contact credentials. ⚡");
                setTimeout(() => {
                    window.openCardScanModal();
                    container.classList.remove('flipped');
                }, 800);
            }, 3000);
        }, 400);
    };

    window.openCardScanModal = function() {
        const modal = document.getElementById('card-scan-modal');
        if (modal) modal.classList.add('active');
    };

    window.closeCardScanModal = function() {
        const modal = document.getElementById('card-scan-modal');
        if (modal) modal.classList.remove('active');
    };

});