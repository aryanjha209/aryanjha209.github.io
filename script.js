document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIGURATION & STATE ---
    // Launch Date: July 8, 2026 at 00:00:00 (IST)
    const launchDate = new Date('July 8, 2026 00:00:00').getTime();
    
    // Auto-detect base API URL to prevent CORS / Port / JSON errors
    const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || !window.location.hostname
        ? 'http://localhost:5000'
        : 'https://aryan-backend-tan.vercel.app';

    // --- 2. OS VISITOR TRACKING API PING ---
    const trackVisitor = async () => {
        try {
            await fetch(`${apiBaseUrl}/api/visit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (err) {
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
            if (titleEl) titleEl.textContent = 'INITIALIZING WORKSPACE';
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

    // --- 4. 3D CARD COIN-FLIP MECHANICS ---
    const cardWrapper = document.getElementById('3d-card-wrapper');
    const viewLensesBtn = document.getElementById('view-lenses-btn');
    const backToLaunchBtn = document.getElementById('back-to-launch-btn');

    if (viewLensesBtn && cardWrapper) {
        viewLensesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            cardWrapper.classList.add('flipped');
            resetTilt();
        });
    }

    if (backToLaunchBtn && cardWrapper) {
        backToLaunchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            cardWrapper.classList.remove('flipped');
            resetTilt();
        });
    }

    // --- 5. HIGH-FIDELITY 3D INTERACTIVE TILT EFFECT ---
    const handleTilt = (clientX, clientY) => {
        if (!cardWrapper) return;
        const rect = cardWrapper.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        // Coordinates relative to card center
        const x = clientX - rect.left - width / 2;
        const y = clientY - rect.top - height / 2;

        // Calculate rotation percentages (max 10 degrees)
        const rotateX = (-y / (height / 2)) * 10;
        
        // If the card is flipped, reverse horizontal tilt to align with back's perspective
        const isFlipped = cardWrapper.classList.contains('flipped');
        const rotateY = (x / (width / 2)) * 10 * (isFlipped ? -1 : 1);

        // Apply 3D matrix rotation including the 180deg flip state
        cardWrapper.style.transform = `rotateY(${isFlipped ? 180 + rotateY : rotateY}deg) rotateX(${rotateX}deg) scale3d(1.01, 1.01, 1.01)`;
    };

    const resetTilt = () => {
        if (!cardWrapper) return;
        const isFlipped = cardWrapper.classList.contains('flipped');
        cardWrapper.style.transform = `rotateY(${isFlipped ? 180 : 0}deg) rotateX(0deg) scale3d(1, 1, 1)`;
    };

    // Desktop mouse tracking
    window.addEventListener('mousemove', (e) => {
        if (!cardWrapper) return;
        const rect = cardWrapper.getBoundingClientRect();
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
    if (cardWrapper) {
        cardWrapper.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                handleTilt(e.touches[0].clientX, e.touches[0].clientY);
            }
        });

        cardWrapper.addEventListener('touchend', resetTilt);
        cardWrapper.addEventListener('mouseleave', resetTilt);
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
                    
                    // Visual confirmation
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