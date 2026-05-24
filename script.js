document.addEventListener('DOMContentLoaded', () => {
    // --- 1. GLOBAL STATE & PWA HANDLERS ---
    let deferredPrompt = null;
    const installBtn = document.getElementById('pwa-install-btn');
    const iosGuide = document.getElementById('ios-guide');
    const installCard = document.getElementById('install-card');
    const toast = document.getElementById('toast');

    // Global Toast Notification Helper
    const showToast = (message) => {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2200);
    };

    // PWA Install Prompt triggers
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        // Unhide install button, hide iOS instructions
        if (installBtn) installBtn.style.display = 'inline-flex';
        if (iosGuide) iosGuide.style.display = 'none';
        if (installCard) installCard.style.display = 'block';
    });

    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User install response: ${outcome}`);
            deferredPrompt = null;
            installBtn.style.display = 'none';
        });
    }

    // Detect standalone display mode or Safari iOS envs
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOS && !isStandalone) {
        if (iosGuide) iosGuide.style.display = 'block';
        if (installBtn) installBtn.style.display = 'none';
        if (installCard) installCard.style.display = 'block';
    } else if (isStandalone) {
        // App is already installed, hide installer widget
        if (installCard) installCard.style.display = 'none';
    }

    // --- 2. SINGLE PAGE APP TAB SWITCHER ---
    const dockItems = document.querySelectorAll('.dock-item');
    const appTabs = document.querySelectorAll('.app-tab');

    dockItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTabId = item.getAttribute('data-tab');
            
            // Remove active tags everywhere
            dockItems.forEach(d => d.classList.remove('active'));
            appTabs.forEach(t => t.classList.remove('active'));

            // Add active tags to selected items
            item.classList.add('active');
            const targetTab = document.getElementById(targetTabId);
            if (targetTab) {
                targetTab.classList.add('active');
                
                // Trigger 3D canvas resize or specific tab logic if needed
                if (targetTabId === 'tab-sandbox') {
                    resetSandboxPhysics();
                }
            }
        });
    });

    // --- 3. TAB 1: LIVE CLOCK & METRICS ---
    const liveTime = document.getElementById('live-time');
    const liveDate = document.getElementById('live-date');

    const updateClock = () => {
        const now = new Date();
        if (liveTime) {
            liveTime.textContent = now.toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
            });
        }
        if (liveDate) {
            liveDate.textContent = now.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }).toUpperCase();
        }
    };
    updateClock();
    setInterval(updateClock, 1000);

    // Live Metrics Simulation
    const cpuChart = document.getElementById('cpu-chart');
    const cpuValue = document.getElementById('cpu-value');
    const ramChart = document.getElementById('ram-chart');
    const ramValue = document.getElementById('ram-value');

    const simulateMetrics = () => {
        // Random CPU sweep (12% to 32%)
        const cpuPercent = Math.floor(Math.random() * 20 + 12);
        // Random RAM sweep (4.1GB to 5.3GB)
        const ramGB = (Math.random() * 1.2 + 4.1).toFixed(1);
        // Dasharray formula: percentage, 100
        if (cpuChart) cpuChart.setAttribute('stroke-dasharray', `${cpuPercent}, 100`);
        if (cpuValue) cpuValue.textContent = `${cpuPercent}%`;
        
        if (ramChart) {
            // max RAM is 16GB, convert GB percentage
            const ramPercent = Math.floor((parseFloat(ramGB) / 16) * 100);
            ramChart.setAttribute('stroke-dasharray', `${ramPercent}, 100`);
        }
        if (ramValue) ramValue.textContent = `${ramGB}GB`;
    };
    simulateMetrics();
    setInterval(simulateMetrics, 2000);

    // --- 4. TAB 2: DEV UTILITIES SUITE ---
    
    // Tool A: JSON Parser
    const jsonInput = document.getElementById('json-input');
    const jsonOutput = document.getElementById('json-output');
    const btnJsonPrettify = document.getElementById('btn-json-prettify');
    const btnJsonClear = document.getElementById('btn-json-clear');
    const btnJsonCopy = document.getElementById('btn-json-copy');
    const jsonError = document.getElementById('json-error');

    if (btnJsonPrettify && jsonInput && jsonOutput && jsonError) {
        btnJsonPrettify.addEventListener('click', () => {
            const rawVal = jsonInput.value.trim();
            jsonError.style.display = 'none';
            jsonError.textContent = '';
            
            if (!rawVal) {
                jsonOutput.value = '';
                return;
            }

            try {
                const parsed = JSON.parse(rawVal);
                jsonOutput.value = JSON.stringify(parsed, null, 4);
                showToast("JSON Formatted successfully! ⚡");
            } catch (err) {
                jsonOutput.value = '';
                jsonError.textContent = `JSON Error: ${err.message}`;
                jsonError.style.display = 'block';
            }
        });
    }

    if (btnJsonClear) {
        btnJsonClear.addEventListener('click', () => {
            if (jsonInput) jsonInput.value = '';
            if (jsonOutput) jsonOutput.value = '';
            if (jsonError) {
                jsonError.style.display = 'none';
                jsonError.textContent = '';
            }
        });
    }

    if (btnJsonCopy && jsonOutput) {
        btnJsonCopy.addEventListener('click', () => {
            const outVal = jsonOutput.value;
            if (!outVal) return;
            navigator.clipboard.writeText(outVal);
            showToast("Copied JSON Output! ⚡");
        });
    }

    // Tool B: Base64 Encoder / Decoder
    const base64Input = document.getElementById('base64-input');
    const base64Output = document.getElementById('base64-output');
    const btnBase64Encode = document.getElementById('btn-base64-encode');
    const btnBase64Decode = document.getElementById('btn-base64-decode');
    const btnBase64Clear = document.getElementById('btn-base64-clear');
    const btnBase64Copy = document.getElementById('btn-base64-copy');

    if (base64Input && base64Output) {
        if (btnBase64Encode) {
            btnBase64Encode.addEventListener('click', () => {
                const text = base64Input.value;
                try {
                    base64Output.value = btoa(unescape(encodeURIComponent(text)));
                    showToast("Encoded text successfully! ⚡");
                } catch (e) {
                    base64Output.value = 'Encoding error: String contains invalid characters.';
                }
            });
        }

        if (btnBase64Decode) {
            btnBase64Decode.addEventListener('click', () => {
                const base = base64Input.value.trim();
                try {
                    base64Output.value = decodeURIComponent(escape(atob(base)));
                    showToast("Decoded Base64 successfully! ⚡");
                } catch (e) {
                    base64Output.value = 'Decoding error: Input is not a valid Base64 string.';
                }
            });
        }

        if (btnBase64Clear) {
            btnBase64Clear.addEventListener('click', () => {
                base64Input.value = '';
                base64Output.value = '';
            });
        }

        if (btnBase64Copy) {
            btnBase64Copy.addEventListener('click', () => {
                const outVal = base64Output.value;
                if (!outVal) return;
                navigator.clipboard.writeText(outVal);
                showToast("Copied output successfully! ⚡");
            });
        }
    }

    // Tool C: Color Swatches board
    const swatches = document.querySelectorAll('.swatch-item');
    swatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            const hex = swatch.getAttribute('data-color');
            if (hex) {
                navigator.clipboard.writeText(hex);
                showToast(`Copied HEX code: ${hex}! ⚡`);
            }
        });
    });

    // --- 5. TAB 3: NOTES & PERSISTED CHECKLISTS ---
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoPriority = document.getElementById('todo-priority');
    const todoItemsHolder = document.getElementById('todo-items-holder');
    const btnClearCompleted = document.getElementById('btn-clear-completed');

    let todos = [];

    // Load from LocalStorage
    const loadTodos = () => {
        const stored = localStorage.getItem('workspace_todos');
        if (stored) {
            try {
                todos = JSON.parse(stored);
            } catch (e) {
                todos = [];
            }
        } else {
            // Default welcome tasks if empty
            todos = [
                { id: 1, text: 'Install this utility suite as a standalone PWA on your home screen', priority: 'high', completed: false },
                { id: 2, text: 'Test formatting your JSON files in the Dev Tools tab', priority: 'medium', completed: false },
                { id: 3, text: 'Interact with the 3D Sandbox geometry prism', priority: 'low', completed: true }
            ];
            saveTodos();
        }
        renderTodos();
    };

    const saveTodos = () => {
        localStorage.setItem('workspace_todos', JSON.stringify(todos));
    };

    const renderTodos = () => {
        if (!todoItemsHolder) return;
        todoItemsHolder.innerHTML = '';

        if (todos.length === 0) {
            todoItemsHolder.innerHTML = `
                <div class="empty-todo">
                    <i class="fas fa-clipboard-check"></i>
                    <p>Everything is completed! Add new tasks above.</p>
                </div>
            `;
            return;
        }

        // Sort: incomplete first, then sort by priority level (high -> medium -> low)
        const prioWeight = { high: 3, medium: 2, low: 1 };
        const sortedTodos = [...todos].sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            return prioWeight[b.priority] - prioWeight[a.priority];
        });

        sortedTodos.forEach(item => {
            const card = document.createElement('div');
            card.className = `todo-item ${item.completed ? 'completed' : ''}`;
            card.setAttribute('data-id', item.id);

            card.innerHTML = `
                <div class="todo-item-left">
                    <button class="check-btn" onclick="toggleTodoCompleted(${item.id})">
                        <i class="fas fa-check"></i>
                    </button>
                    <span class="todo-text">${item.text}</span>
                </div>
                <div class="todo-item-right">
                    <span class="prio-badge ${item.priority}">${item.priority}</span>
                    <button class="delete-btn" onclick="deleteTodoItem(${item.id})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            todoItemsHolder.appendChild(card);
        });
    };

    // Todo Form listener
    if (todoForm && todoInput && todoPriority) {
        todoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const textVal = todoInput.value.trim();
            const prioVal = todoPriority.value;

            if (!textVal) return;

            const newItem = {
                id: Date.now(),
                text: textVal,
                priority: prioVal,
                completed: false
            };

            todos.push(newItem);
            saveTodos();
            renderTodos();

            todoInput.value = '';
            todoPriority.value = 'medium';
            showToast("New task logged successfully! ⚡");
        });
    }

    // Toggle Checkmark
    window.toggleTodoCompleted = (id) => {
        const item = todos.find(t => t.id === id);
        if (item) {
            item.completed = !item.completed;
            saveTodos();
            renderTodos();
        }
    };

    // Delete Item
    window.deleteTodoItem = (id) => {
        todos = todos.filter(t => t.id !== id);
        saveTodos();
        renderTodos();
    };

    // Clear completed
    if (btnClearCompleted) {
        btnClearCompleted.addEventListener('click', () => {
            todos = todos.filter(t => !t.completed);
            saveTodos();
            renderTodos();
            showToast("Cleared completed tasks! ⚡");
        });
    }

    // Load tasks on startup
    loadTodos();

    // --- 6. TAB 4: 3D PRISM GEOMETRY SANDBOX ---
    const prism = document.getElementById('sandbox-prism');
    
    // Sliders
    const sliderSpeed = document.getElementById('slider-speed');
    const valSpeed = document.getElementById('val-speed');
    const sliderScale = document.getElementById('slider-scale');
    const valScale = document.getElementById('val-scale');
    const sliderGlow = document.getElementById('slider-glow');
    const valGlow = document.getElementById('val-glow');

    // Physical Rotation state
    let rotX = -20;
    let rotY = 35;
    let autoRotationActive = true;
    let autoSpinAngle = 0;

    // Drags variables
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    // Load active settings from slider inputs
    const getSliderVals = () => {
        return {
            speed: sliderSpeed ? parseFloat(sliderSpeed.value) : 1,
            scale: sliderScale ? parseFloat(sliderScale.value) : 1,
            glow: sliderGlow ? parseInt(sliderGlow.value) : 50
        };
    };

    // Physics Animation Loop
    const physicsLoop = () => {
        if (!prism) return;
        const vals = getSliderVals();

        if (autoRotationActive && !isDragging) {
            autoSpinAngle += 0.4 * vals.speed;
            const computedX = rotX + Math.sin(autoSpinAngle * 0.02) * 5;
            const computedY = rotY + autoSpinAngle;
            prism.style.transform = `rotateX(${computedX}deg) rotateY(${computedY}deg) scale3d(${vals.scale}, ${vals.scale}, ${vals.scale})`;
        }
        
        requestAnimationFrame(physicsLoop);
    };

    // Direct drag orientation
    const handleDragStart = (clientX, clientY) => {
        isDragging = true;
        autoRotationActive = false;
        startX = clientX;
        startY = clientY;
    };

    const handleDragMove = (clientX, clientY) => {
        if (!isDragging || !prism) return;
        const vals = getSliderVals();

        const deltaX = clientX - startX;
        const deltaY = clientY - startY;

        // Map movement coordinates to rotation sweeps
        rotY += deltaX * 0.5;
        rotX -= deltaY * 0.5;

        // Cap rotX rotation limits to keep face integrity
        rotX = Math.max(-80, Math.min(80, rotX));

        startX = clientX;
        startY = clientY;

        prism.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(${vals.scale}, ${vals.scale}, ${vals.scale})`;
    };

    const handleDragEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        // Resume auto-spin rotation after a small sleep
        setTimeout(() => {
            if (!isDragging) {
                autoRotationActive = true;
            }
        }, 2000);
    };

    // Prism Event binds
    if (prism) {
        // Desktop Drag mouse events
        prism.addEventListener('mousedown', (e) => {
            handleDragStart(e.clientX, e.clientY);
        });

        window.addEventListener('mousemove', (e) => {
            handleDragMove(e.clientX, e.clientY);
        });

        window.addEventListener('mouseup', handleDragEnd);

        // Touch drag events for mobile phone PWA screens
        prism.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
            }
        });

        prism.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        });

        prism.addEventListener('touchend', handleDragEnd);
    }

    // Slider label value binding updates
    if (sliderSpeed && valSpeed) {
        sliderSpeed.addEventListener('input', () => {
            valSpeed.textContent = `${sliderSpeed.value}x`;
        });
    }

    if (sliderScale && valScale) {
        sliderScale.addEventListener('input', () => {
            valScale.textContent = `${sliderScale.value}x`;
        });
    }

    if (sliderGlow && valGlow) {
        sliderGlow.addEventListener('input', () => {
            valGlow.textContent = `${sliderGlow.value}%`;
            // Apply glow values dynamically to prism faces
            const glowVal = parseInt(sliderGlow.value);
            const faces = document.querySelectorAll('.prism-face');
            faces.forEach(face => {
                face.style.boxShadow = `
                    inset 0 0 ${glowVal * 0.7}px rgba(78, 191, 21, ${glowVal * 0.003}),
                    0 0 ${glowVal * 0.6}px rgba(78, 191, 21, ${glowVal * 0.002})
                `;
            });
        });
    }

    // Reset Stage logic
    const resetSandboxPhysics = () => {
        autoRotationActive = true;
        rotX = -20;
        rotY = 35;
        autoSpinAngle = 0;
    };

    // Kickstart Physics loop
    physicsLoop();

});