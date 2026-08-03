document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       1. FIGMA WORKSPACE SIMULATOR
       ========================================== */
    const canvasTargets = document.querySelectorAll('.canvas-target');
    const layerItems = document.querySelectorAll('.layers-list .layer-item');
    
    // Properties elements
    const selectedNameEl = document.getElementById('selected-node-name');
    const selectedTypeEl = document.getElementById('selected-node-type');
    const propWidthEl = document.getElementById('prop-width');
    const propHeightEl = document.getElementById('prop-height');
    const propPosxEl = document.getElementById('prop-posx');
    const propPosyEl = document.getElementById('prop-posy');
    
    const sectionAutolayout = document.getElementById('section-autolayout');
    const autolayoutDir = document.getElementById('autolayout-dir');
    const autolayoutGap = document.getElementById('autolayout-gap');
    const autolayoutPadding = document.getElementById('autolayout-padding');
    
    const sectionTypography = document.getElementById('section-typography');
    const fontFamilyEl = document.getElementById('font-family');
    const fontSizeEl = document.getElementById('font-size');
    const fontLhEl = document.getElementById('font-lh');
    
    const styleBgColor = document.getElementById('style-bg-color');
    const styleHexText = document.getElementById('style-hex-text');
    const rowRadiusInfo = document.getElementById('row-radius-info');
    const styleRadius = document.getElementById('style-radius');

    // Node metadata database
    const nodeData = {
        'desktop-hero': {
            name: 'Desktop - Hero Section',
            type: 'Frame / Artboard',
            width: '1440', height: '800', x: '120', y: '80',
            autolayout: { dir: 'Vertical', gap: '64px', padding: '80px 120px' },
            bg: '#07070A', radius: '0px'
        },
        'navbar': {
            name: 'Navigation Bar',
            type: 'Auto Layout',
            width: '820', height: '64', x: '144', y: '112',
            autolayout: { dir: 'Horizontal', gap: '32px', padding: '24px 80px' },
            bg: 'Transparent', radius: '0px'
        },
        'hero-title': {
            name: 'Heading Title',
            type: 'Text Element',
            width: '520', height: '120', x: '144', y: '216',
            typography: { family: 'Vazirmatn (900)', size: '48px', lh: '1.3' },
            bg: '#FFFFFF', radius: '0px'
        },
        'hero-actions': {
            name: 'Action Buttons',
            type: 'Auto Layout',
            width: '320', height: '44', x: '144', y: '360',
            autolayout: { dir: 'Horizontal', gap: '16px', padding: '0px' },
            bg: 'Transparent', radius: '0px'
        },
        'primary-btn': {
            name: '❖ Button/Primary',
            type: 'Component Instance',
            width: '120', height: '40', x: '144', y: '362',
            bg: '#6C5DD3', radius: '8px'
        },
        'hero-card': {
            name: '❖ Info Card',
            type: 'Component Instance',
            width: '240', height: '160', x: '144', y: '428',
            bg: 'rgba(255,255,255,0.03)', radius: '16px'
        }
    };

    function updateInspectorPanel(nodeId) {
        const data = nodeData[nodeId];
        if (!data) return;

        // General
        selectedNameEl.textContent = data.name;
        selectedTypeEl.textContent = data.type;
        propWidthEl.value = data.width;
        propHeightEl.value = data.height;
        propPosxEl.value = data.x;
        propPosyEl.value = data.y;

        // Auto layout visibility
        if (data.autolayout) {
            sectionAutolayout.style.display = 'block';
            autolayoutDir.innerHTML = `${data.autolayout.dir} ${data.autolayout.dir === 'Vertical' ? '<i class="fa-solid fa-arrow-down"></i>' : '<i class="fa-solid fa-arrow-left"></i>'}`;
            autolayoutGap.textContent = data.autolayout.gap;
            autolayoutPadding.textContent = data.autolayout.padding;
        } else {
            sectionAutolayout.style.display = 'none';
        }

        // Typography visibility
        if (data.typography) {
            sectionTypography.style.display = 'block';
            fontFamilyEl.textContent = data.typography.family;
            fontSizeEl.textContent = data.typography.size;
            fontLhEl.textContent = data.typography.lh;
        } else {
            sectionTypography.style.display = 'none';
        }

        // Fill & Style
        styleBgColor.style.backgroundColor = data.bg;
        styleHexText.textContent = data.bg.startsWith('#') ? data.bg.toUpperCase() : 'TRANSPARENT';
        
        if (data.radius) {
            rowRadiusInfo.style.display = 'flex';
            styleRadius.textContent = data.radius;
        } else {
            rowRadiusInfo.style.display = 'none';
        }
    }

    function selectNode(nodeId) {
        // Deselect all targets
        canvasTargets.forEach(t => t.classList.remove('focused'));
        // Deselect all layer list items
        layerItems.forEach(item => item.classList.remove('active'));

        // Highlight corresponding canvas element (if any)
        const targetEl = document.getElementById(`node-${nodeId}`);
        if (targetEl) {
            targetEl.classList.add('focused');
        } else if (nodeId === 'desktop-hero') {
            document.getElementById('canvas-frame-node').style.boxShadow = '0 0 0 2px #6C5DD3';
            setTimeout(() => {
                document.getElementById('canvas-frame-node').style.boxShadow = '0 4px 24px rgba(0,0,0,0.4)';
            }, 1000);
        }

        // Highlight layer item
        const layerItem = Array.from(layerItems).find(item => item.getAttribute('data-node') === nodeId);
        if (layerItem) {
            layerItem.classList.add('active');
        }

        // Update details
        updateInspectorPanel(nodeId);
    }

    // Attach click events to canvas elements
    canvasTargets.forEach(target => {
        target.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = target.id.replace('node-', '');
            selectNode(id);
        });
    });

    // Attach click events to layer sidebar items
    layerItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = item.getAttribute('data-node');
            if (id) {
                selectNode(id);
            }
        });
    });


    /* ==========================================
       2. INTERACTIVE COMPARISON SLIDER
       ========================================== */
    const slider = document.querySelector('.comparison-slider');
    const wireframeView = document.querySelector('.view-wireframe');
    const handle = document.querySelector('.slider-handle');

    if (slider && wireframeView && handle) {
        let isDragging = false;

        function moveSlider(clientX) {
            const rect = slider.getBoundingClientRect();
            // In RTL, we calculate relative to the right side or standard width percentage
            let position = clientX - rect.left;
            
            // Constrain position within slider bounds
            if (position < 0) position = 0;
            if (position > rect.width) position = rect.width;
            
            const percentage = (position / rect.width) * 100;
            
            // Set widths and handle positions
            // Because wireframe is absolute on left or right, let's use percentage.
            // Since dir="rtl" is used on the page, the clipping might behave according to absolute position.
            // Let's set wireframeView width directly:
            wireframeView.style.width = `${100 - percentage}%`;
            handle.style.left = `${percentage}%`;
        }

        handle.addEventListener('mousedown', () => {
            isDragging = true;
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            moveSlider(e.clientX);
        });

        // Touch support
        handle.addEventListener('touchstart', () => {
            isDragging = true;
        });

        window.addEventListener('touchend', () => {
            isDragging = false;
        });

        window.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            if (e.touches.length > 0) {
                moveSlider(e.touches[0].clientX);
            }
        });

        // Dynamic scaling of slider on mobile and tablet screens
        const scaleSlider = () => {
            const wrapper = document.querySelector('.comparison-slider-wrapper');
            if (wrapper) {
                const rect = wrapper.getBoundingClientRect();
                const scale = Math.min(1, rect.width / 900);
                wrapper.style.setProperty('--slider-scale', scale);
            }
        };
        
        window.addEventListener('resize', scaleSlider);
        scaleSlider(); // Initial scale
    }


    /* ==========================================
       3. DESIGN SYSTEM THEME CONFIGURATOR
       ========================================== */
    const themeButtons = document.querySelectorAll('.theme-btn');
    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class
            themeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const primaryColor = btn.getAttribute('data-primary');
            const primaryGlow = btn.getAttribute('data-primary-glow');

            // Apply style changes to the entire page variables
            document.documentElement.style.setProperty('--primary', primaryColor);
            document.documentElement.style.setProperty('--primary-glow', primaryGlow);
            
            // Dynamically update metadata for primary buttons so the Figma simulator shows current state
            nodeData['primary-btn'].bg = primaryColor;
            
            // Update active node in simulator if it's the primary button
            const activeLayer = document.querySelector('.layers-list .layer-item.active');
            if (activeLayer && activeLayer.getAttribute('data-node') === 'primary-btn') {
                updateInspectorPanel('primary-btn');
            }
        });
    });


    /* ==========================================
       4. PERSISTENT INTERACTIVE CHAT PANEL
       ========================================== */
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat-btn');
    const actionFastBtns = document.querySelectorAll('.action-btn-fast');

    function appendMessage(text, type) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `msg ${type}`;
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function handleRezaResponse() {
        appendMessage('در حال تایپ...', 'received');
        const typingIndicator = chatMessages.lastChild;

        setTimeout(() => {
            // Remove typing indicator
            typingIndicator.remove();
            
            // Realistic and friendly response representing Reza Esmaeili
            appendMessage('سپاسگزارم کارفرمای گرامی! پیام و تمایل شما برای همکاری دریافت شد. بسیار خرسندم از اینکه سلیقه شما با طراحی‌های مدرن، متدهای اتولایه و استانداردهای سطح بالا همسو است. پیشنهاد می‌کنم جزئیات پروژه خود را ارسال کنید یا یک گفتگوی صوتی کوتاه داشته باشیم تا سریعاً وایدفریم‌ها و اسکچ‌های اولیه را برای پروژه‌تان استارت بزنیم. چه زمانی برای شما مناسب‌تر است؟', 'received');
        }, 1500);
    }

    sendChatBtn.addEventListener('click', () => {
        const text = chatInput.value.trim();
        if (!text) return;

        appendMessage(text, 'sent');
        chatInput.value = '';

        // Trigger reply
        handleRezaResponse();
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatBtn.click();
        }
    });

    // Fast action buttons integration with chat console
    actionFastBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            actionFastBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const text = btn.textContent;
            appendMessage(text, 'sent');

            // Trigger reply
            handleRezaResponse();
        });
    });

});