/**
 * app.js
 * 
 * Core application script for SprintPilot UI interactions.
 * Handles navigation highlighting, interactive toggles, modals, toasts, and page-specific behaviors.
 * No external dependencies or persistence - all state is ephemeral and UI-only.
 */

(function() {
    'use strict';

    var _initialized = false;

    // ===========================================
    // Active Navigation Highlighting
    // ===========================================
    function highlightActiveNav() {
        const navRoot = document.querySelector('[data-component="top-nav"]') || document.querySelector('.nav-center');
        const navLinks = navRoot ? navRoot.querySelectorAll('a') : document.querySelectorAll('.nav-center a');
        const bodyPage = document.body && document.body.getAttribute('data-page');
        const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';

        navLinks.forEach(link => {
            const dataNav = link.getAttribute('data-nav');
            let matched = false;

            // Prefer data-nav attribute if present and body[data-page] is set
            if (dataNav && bodyPage) {
                matched = dataNav === bodyPage;
            } else {
                // Fallback to comparing resolved link pathname vs current pathname
                try {
                    const linkHref = link.getAttribute('href') || '';
                    const linkUrl = new URL(linkHref, window.location.origin);
                    const linkPath = (linkUrl.pathname || '').replace(/\/+$/, '') || '/';
                    matched = linkPath === currentPath;
                } catch (e) {
                    matched = false;
                }
            }

            if (matched) {
                link.classList.add('is-active');
                link.classList.add('active-nav'); // fallback class
                link.setAttribute('aria-current', 'page');
            } else {
                link.classList.remove('is-active');
                link.classList.remove('active-nav');
                link.removeAttribute('aria-current');
            }

            // attach nav change emitter (idempotent add)
            if (!link.__sprintNavListener) {
                link.addEventListener('click', function(e) {
                    // Allow normal navigation but emit event for SPA handling
                    const href = link.getAttribute('href') || '';
                    const page = dataNav || href;
                    document.dispatchEvent(new CustomEvent('sprint:nav:change', { detail: { page } }));
                    // Update highlighting immediately for client-side navs
                    setTimeout(highlightActiveNav, 0);
                });
                link.__sprintNavListener = true;
            }
        });
    }

    // ===========================================
    // Mobile Menu Toggle
    // ===========================================
    function initMobileMenu() {
        const toggle = document.querySelector('[data-component="mobile-menu-toggle"]') || document.querySelector('.mobile-menu-toggle');
        const navCenter = document.querySelector('[data-component="top-nav"] .nav-center') || document.querySelector('.nav-center');
        const navActions = document.querySelector('.nav-actions');
        
        if (toggle && navCenter && navActions) {
            toggle.addEventListener('click', function() {
                const isExpanded = this.getAttribute('aria-expanded') === 'true';
                this.setAttribute('aria-expanded', String(!isExpanded));
                navCenter.classList.toggle('is-active');
                navCenter.classList.toggle('active'); // fallback
                navActions.classList.toggle('is-active');
                navActions.classList.toggle('active'); // fallback
            });

            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && navCenter.classList.contains('is-active')) {
                    toggle.setAttribute('aria-expanded', 'false');
                    navCenter.classList.remove('is-active');
                    navCenter.classList.remove('active');
                    navActions.classList.remove('is-active');
                    navActions.classList.remove('active');
                    try { toggle.focus(); } catch (err) {}
                }
            });
        }
    }

    // ===========================================
    // Goal Card Toggle (setup.html)
    // ===========================================
    function initGoalCards() {
        const goalCards = document.querySelectorAll('[data-component="goal-card"], .goal-card');
        
        goalCards.forEach(card => {
            function toggleGoalInternal() {
                const isActive = card.classList.contains('is-selected') || card.classList.contains('active');
                card.classList.toggle('is-selected');
                card.classList.toggle('active'); // fallback
                const newState = !isActive;
                // Set aria-pressed on inner button if present, otherwise on card for compatibility
                const btn = card.querySelector('button[aria-pressed]') || card.querySelector('.goal-toggle');
                if (btn && btn.setAttribute) {
                    btn.setAttribute('aria-pressed', String(newState));
                } else {
                    card.setAttribute('aria-pressed', String(newState));
                }
                // emit custom event with id if present
                const id = card.getAttribute('data-id') || card.id || null;
                document.dispatchEvent(new CustomEvent('sprint:goal:toggle', { detail: { id, selected: newState } }));
            }

            // attach click/keyboard handlers if not already attached
            if (!card.__sprintGoalListener) {
                // prefer clicking inner toggle button if present
                const innerToggle = card.querySelector('.goal-toggle') || card.querySelector('button[aria-pressed]');
                if (innerToggle && !innerToggle.__sprintInnerToggle) {
                    innerToggle.addEventListener('click', function(e) {
                        e.stopPropagation();
                        toggleGoalInternal();
                    });
                    innerToggle.__sprintInnerToggle = true;
                }
                card.addEventListener('click', toggleGoalInternal);
                
                card.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleGoalInternal();
                    }
                });
                card.__sprintGoalListener = true;
            }
        });
    }

    // ===========================================
    // Character Card Selection (studio.html)
    // ===========================================
    function initCharacterCards() {
        const characterCards = document.querySelectorAll('.character-card');
        
        characterCards.forEach(card => {
            card.addEventListener('click', function() {
                characterCards.forEach(c => {
                    c.classList.remove('selected');
                    c.removeAttribute('aria-selected');
                });
                this.classList.add('selected');
                this.setAttribute('aria-selected', 'true');
                
                // Update preview panel if exists
                const previewPanel = document.querySelector('.preview-panel');
                if (previewPanel) {
                    const img = this.querySelector('img');
                    const previewImg = previewPanel.querySelector('.preview-image');
                    if (img && previewImg) {
                        previewImg.src = img.src;
                    }
                }
            });

            card.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });
    }

    // ===========================================
    // Style Pill Toggle (studio.html)
    // ===========================================
    function initStylePills() {
        const stylePills = document.querySelectorAll('[data-component="style-pill"], .style-pill');
        
        stylePills.forEach(pill => {
            pill.addEventListener('click', function() {
                this.classList.toggle('is-active');
                this.classList.toggle('active'); // fallback
                const isActive = this.classList.contains('is-active') || this.classList.contains('active');
                this.setAttribute('aria-pressed', String(isActive));
            });

            pill.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });
    }

    // ===========================================
    // Range Slider Value Display
    // ===========================================
    function initRangeSliders() {
        const sliders = document.querySelectorAll('input[type="range"]');
        
        sliders.forEach(slider => {
            const valueDisplay = slider.parentElement ? slider.parentElement.querySelector('.slider-value') : null;
            
            if (valueDisplay) {
                slider.addEventListener('input', function() {
                    valueDisplay.textContent = this.value;
                });
                // initialize display
                valueDisplay.textContent = slider.value;
            }
        });
    }

    // ===========================================
    // Toast Notifications
    // ===========================================
    function showToast(message, type = 'info', timeout = 3000) {
        const toastContainer = document.querySelector('[data-component="toast-root"]') || document.getElementById('toast-container') || createToastContainer();
        
        const toast = document.createElement('div');
        const toastId = 'toast-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        toast.className = 'toast toast-' + type;
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.setAttribute('data-toast', '');
        toast.id = toastId;
        
        const icon = type === 'success' ? '?' : type === 'error' ? '?' : '?';
        const inner = document.createElement('div');
        inner.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-message">${message}</span>`;
        toast.appendChild(inner);
        
        toastContainer.appendChild(toast);

        // emit show event
        document.dispatchEvent(new CustomEvent('sprint:toast:show', { detail: { id: toastId, message, type } }));
        
        // slight delay to allow CSS transition
        setTimeout(() => {
            toast.classList.add('toast-show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => {
                try { toast.remove(); } catch (e) {}
                // emit hide event
                document.dispatchEvent(new CustomEvent('sprint:toast:hide', { detail: { id: toastId, message, type } }));
            }, 300);
        }, timeout);
    }

    function createToastContainer() {
        const existing = document.querySelector('[data-component="toast-root"]') || document.getElementById('toast-container');
        if (existing) return existing;
        const container = document.createElement('div');
        container.setAttribute('data-component', 'toast-root');
        container.id = 'toast-container';
        container.style.cssText = 'position: fixed; top: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 12px;';
        document.body.appendChild(container);
        return container;
    }

    // ===========================================
    // Simple Modal
    // ===========================================
    function showModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'modal-title');
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="modal-title">${title}</h2>
                    <button class="modal-close" aria-label="Close modal">&times;</button>
                </div>
                <div class="modal-body">${content}</div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        setTimeout(() => modal.classList.add('modal-show'), 10);
        
        const closeBtn = modal.querySelector('.modal-close');
        const closeModal = () => {
            modal.classList.remove('modal-show');
            setTimeout(() => modal.remove(), 300);
        };
        
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        function escHandler(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        }
        document.addEventListener('keydown', escHandler);
    }

    // ===========================================
    // Loading State
    // ===========================================
    function showLoading(element, text = 'Loading...') {
        if (!element) return function noop(){};
        const originalText = element.textContent;
        element.textContent = text;
        element.disabled = true;
        element.classList.add('is-loading');
        element.classList.add('loading'); // fallback
        
        return () => {
            element.textContent = originalText;
            element.disabled = false;
            element.classList.remove('is-loading');
            element.classList.remove('loading');
        };
    }

    // ===========================================
    // Business Type Pills (setup.html)
    // ===========================================
    function initBusinessTypePills() {
        const pills = document.querySelectorAll('[data-component="business-type-pill"], .business-type-pill');
        const dropdown = document.getElementById('business-type');
        
        pills.forEach(pill => {
            // ensure pills are keyboard accessible
            pill.setAttribute('tabindex', pill.getAttribute('tabindex') || '0');
            if (!pill.hasAttribute('role')) pill.setAttribute('role', 'button');

            pill.addEventListener('click', function() {
                const type = this.getAttribute('data-type') || this.getAttribute('data-pill');
                if (dropdown && type) {
                    dropdown.value = type;
                }
                pills.forEach(p => {
                    p.classList.remove('is-selected');
                    p.classList.remove('active');
                    p.setAttribute('aria-pressed', 'false');
                });
                this.classList.add('is-selected');
                this.classList.add('active'); // fallback
                this.setAttribute('aria-pressed', 'true');
                // emit pill change
                document.dispatchEvent(new CustomEvent('sprint:pill:change', { detail: { pill: type } }));
            });

            pill.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });
    }

    // ===========================================
    // Sprint Actions (setup.html)
    // ===========================================
    function initSprintActions() {
        const startBtn = document.getElementById('start-sprint-btn');
        const saveDraftBtn = document.getElementById('save-draft-btn');
        
        if (startBtn) {
            startBtn.addEventListener('click', function() {
                // emit action:start
                document.dispatchEvent(new CustomEvent('sprint:action:start', { detail: { id: 'start-sprint-btn' } }));
                const stopLoading = showLoading(this, 'Launching Sprint...');
                
                setTimeout(() => {
                    stopLoading();
                    showToast('Sprint started successfully!', 'success');
                }, 2000);
            });
        }
        
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', function() {
                // emit action:save
                document.dispatchEvent(new CustomEvent('sprint:action:save', { detail: { id: 'save-draft-btn' } }));
                const stopLoading = showLoading(this, 'Saving...');
                
                setTimeout(() => {
                    stopLoading();
                    this.textContent = 'Saved!';
                    showToast('Draft saved', 'success');
                    
                    setTimeout(() => {
                        this.textContent = 'Save Draft';
                    }, 1500);
                }, 1500);
            });
        }
    }

    // ===========================================
    // Sticky Action Bar
    // ===========================================
    function initStickyActionBar() {
        const actionBar = document.querySelector('[data-component="sticky-bar"]') || document.querySelector('.action-buttons, .sticky-action-bar');
        
        if (actionBar) {
            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.intersectionRatio < 1) {
                        actionBar.classList.add('is-sticky');
                        actionBar.classList.add('stuck'); // fallback
                        document.dispatchEvent(new CustomEvent('sprint:sticky:change', { detail: { isSticky: true } }));
                    } else {
                        actionBar.classList.remove('is-sticky');
                        actionBar.classList.remove('stuck');
                        document.dispatchEvent(new CustomEvent('sprint:sticky:change', { detail: { isSticky: false } }));
                    }
                },
                { threshold: [1] }
            );
            
            // observer.observe may throw if element not in layout yet; guard with try/catch
            try {
                observer.observe(actionBar);
            } catch (e) {
                // fallback: simple scroll listener
                const onScroll = () => {
                    const isSticky = window.scrollY > 140;
                    actionBar.classList.toggle('is-sticky', isSticky);
                    document.dispatchEvent(new CustomEvent('sprint:sticky:change', { detail: { isSticky } }));
                };
                window.addEventListener('scroll', onScroll);
                onScroll();
            }
        }
    }

    // ===========================================
    // Smooth Scroll
    // ===========================================
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#' || href.length <= 1) return;
                
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    // ===========================================
    // Keyboard Navigation
    // ===========================================
    function initKeyboardNav() {
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-nav');
            }
        });

        document.addEventListener('mousedown', function() {
            document.body.classList.remove('keyboard-nav');
        });
    }

    // ===========================================
    // Form Auto-save
    // ===========================================
    function initAutoSave() {
        let autoSaveTimer;
        const inputs = document.querySelectorAll('input, textarea, select');
        
        function scheduleAutoSave() {
            clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(() => {
                console.log('Auto-saving...');
                showToast('Draft auto-saved', 'info', 2000);
            }, 5000);
        }
        
        inputs.forEach(input => {
            input.addEventListener('input', scheduleAutoSave);
        });
    }

    // ===========================================
    // Accessibility Announcements
    // ===========================================
    function announcePageLoad() {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'visually-hidden';
        announcement.textContent = document.title + ' loaded';
        document.body.appendChild(announcement);
    }

    // ===========================================
    // Progress Bar Animation
    // ===========================================
    function animateProgressBar(element, targetPercent, duration = 1000) {
        if (!element) return;
        
        const start = parseFloat(element.style.width) || 0;
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            const current = start + (targetPercent - start) * eased;
            
            element.style.width = current + '%';
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    }

    // ===========================================
    // Generate Button (studio.html)
    // ===========================================
    function initGenerateButton() {
        const generateBtn = document.querySelector('.btn-generate');
        
        if (generateBtn) {
            generateBtn.addEventListener('click', function() {
                const stopLoading = showLoading(this, 'Generating...');
                
                setTimeout(() => {
                    stopLoading();
                    showToast('Character generated successfully!', 'success');
                }, 2500);
            });
        }
    }

    // ===========================================
    // Drawer controls (minimal)
    // ===========================================
    function openDrawer(id) {
        const drawer = id ? document.querySelector('#' + id) : document.querySelector('[data-component="drawer"]');
        if (drawer) {
            drawer.classList.add('is-active');
            drawer.classList.add('active'); // fallback
            document.dispatchEvent(new CustomEvent('sprint:drawer:open', { detail: { id: id || (drawer.id || null) } }));
        }
    }

    function closeDrawer() {
        const drawer = document.querySelector('[data-component="drawer"]') || document.querySelector('.drawer');
        if (drawer) {
            drawer.classList.remove('is-active');
            drawer.classList.remove('active');
            document.dispatchEvent(new CustomEvent('sprint:drawer:close', { detail: { id: drawer.id || null } }));
        }
    }

    // ===========================================
    // Programmatic goal toggle API
    // ===========================================
    function toggleGoal(id, state) {
        if (!id) return;
        const selector = '[data-component="goal-card"][data-id="' + id + '"]';
        let card = document.querySelector(selector);
        if (!card) {
            card = document.querySelector('.goal-card[data-id="' + id + '"]');
        }
        if (!card) return;
        const isActive = card.classList.contains('is-selected') || card.classList.contains('active');
        const shouldSelect = typeof state === 'boolean' ? state : !isActive;
        if (shouldSelect) {
            card.classList.add('is-selected');
            card.classList.add('active'); // fallback
        } else {
            card.classList.remove('is-selected');
            card.classList.remove('active');
        }
        // sync inner toggle/button aria-pressed if present
        const btn = card.querySelector('button[aria-pressed]') || card.querySelector('.goal-toggle');
        if (btn && btn.setAttribute) {
            btn.setAttribute('aria-pressed', String(shouldSelect));
        } else {
            card.setAttribute('aria-pressed', String(shouldSelect));
        }
        document.dispatchEvent(new CustomEvent('sprint:goal:toggle', { detail: { id, selected: shouldSelect } }));
    }

    // ===========================================
    // Initialize All
    // ===========================================
    function init() {
        // Integrity checks per contract (lightweight; don't abort for optional components)
        const errors = [];
        const warnings = [];
        if (!document.body.hasAttribute('data-page')) {
            errors.push('Missing body[data-page]');
        }
        const topNavExists = !!(document.querySelector('[data-component="top-nav"]') || document.querySelector('.nav-center'));
        if (!topNavExists) {
            errors.push('Missing [data-component="top-nav"] or .nav-center');
        }
        const toastRoot = document.querySelector('[data-component="toast-root"]') || document.getElementById('toast-container');
        if (!toastRoot) {
            // create minimal toast root instead of aborting
            createToastContainer();
            warnings.push('Missing [data-component="toast-root"]; created fallback toast container');
        }
        const goalCards = document.querySelectorAll('[data-component="goal-card"], .goal-card');
        if (goalCards.length > 0) {
            goalCards.forEach(gc => {
                if (!gc.getAttribute('data-id') && !gc.id) {
                    errors.push('Goal card missing data-id or id');
                }
            });
        }
        const bodyPage = document.body.getAttribute('data-page');
        const stickyExists = !!(document.querySelector('[data-component="sticky-bar"]') || document.querySelector('.action-buttons, .sticky-action-bar'));
        // sticky bar is required on setup page only
        if (bodyPage === 'setup' && !stickyExists) {
            warnings.push('Missing sticky action bar on setup page');
        }

        if (errors.length) {
            console.error('SprintPilot integrity checks failed:', errors);
            document.dispatchEvent(new CustomEvent('sprint:integrity:fail', { detail: { errors } }));
            return;
        }
        if (warnings.length) {
            console.warn('SprintPilot integrity warnings:', warnings);
            document.dispatchEvent(new CustomEvent('sprint:integrity:warn', { detail: { warnings } }));
        }

        // proceed with wiring
        highlightActiveNav();
        initMobileMenu();
        initGoalCards();
        initCharacterCards();
        initStylePills();
        initRangeSliders();
        initBusinessTypePills();
        initSprintActions();
        initStickyActionBar();
        initSmoothScroll();
        initKeyboardNav();
        initGenerateButton();
        announcePageLoad();
        
        // Optional: auto-save only on setup page
        if ((window.location.pathname || '').includes('setup') || document.body.getAttribute('data-page') === 'setup') {
            initAutoSave();
        }

        _initialized = true;
        // emit page ready
        document.dispatchEvent(new CustomEvent('sprint:page:ready', { detail: { pathname: window.location.pathname } }));
    }

    // Public notify wrapper around showToast
    function notify(options) {
        if (typeof options === 'string') {
            showToast(options);
            return;
        }
        const message = options && options.message ? options.message : '';
        const type = options && options.type ? options.type : 'info';
        const timeout = options && typeof options.timeout === 'number' ? options.timeout : 3000;
        showToast(message, type, timeout);
    }

    // Teardown (minimal): flip flag and emit event. Detailed removal of all handlers would require larger refactor.
    function teardown() {
        _initialized = false;
        document.dispatchEvent(new CustomEvent('sprint:teardown', { detail: {} }));
    }

    // Run on DOM ready (auto-run as before; if integrator pre-sets window.SprintPilot.__manualInit = true before this script, they can prevent auto-run)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function autoInitHandler() {
            // allow integrator to set window.SprintPilot.__manualInit = true before script load to prevent auto-run
            if (window.SprintPilot && window.SprintPilot.__manualInit) {
                return;
            }
            init();
            document.removeEventListener('DOMContentLoaded', autoInitHandler);
        });
    } else {
        if (!(window.SprintPilot && window.SprintPilot.__manualInit)) {
            init();
        }
    }

    // Expose utilities and public API globally for page-specific use
    window.SprintPilot = Object.assign(window.SprintPilot || {}, {
        init: function(options) {
            // mark manual init requested so auto-run won't duplicate if set prior
            this.__manualInit = true;
            init(options);
        },
        teardown: teardown,
        notify: notify,
        toggleGoal: toggleGoal,
        openDrawer: openDrawer,
        closeDrawer: closeDrawer,
        showToast: notify, // backward mapping
        showModal: showModal,
        showLoading: showLoading,
        animateProgressBar: animateProgressBar
    });

})();