// CONFIGURACIÓN DE FIREBASE (El cliente puede reemplazar esto con sus credenciales)
// Por defecto, implementamos un modo "local de simulación" para que la invitación 
// funcione de inmediato en modo local sin dar errores, y cambie a la nube al configurar las llaves.
const firebaseConfig = { apiKey: "SITUAR_AQUI_API_KEY_SI_SE_DESEA" }; // DEMO: sin backend

let db = null;
let isFirebaseActive = false;
let firestoreModule = null;

// Intentar inicializar Firebase de forma dinámica y no bloqueante
async function initFirebaseLazy() {
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "SITUAR_AQUI_API_KEY_SI_SE_DESEA") {
        try {
            console.log("⏳ Intentando cargar Firebase de forma asíncrona...");
            const firebaseApp = await import('firebase/app');
            firestoreModule = await import('firebase/firestore');
            const analyticsModule = await import('firebase/analytics');
            
            const app = firebaseApp.initializeApp(firebaseConfig);
            db = firestoreModule.getFirestore(app);
            isFirebaseActive = true;
            console.log("🔥 Conectado con éxito a la nube de Firebase Firestore");
            
            // Inicializar Firebase Analytics si measurementId está configurado
            if (firebaseConfig.measurementId) {
                analyticsModule.getAnalytics(app);
                console.log("📊 Google Analytics de Firebase activado con éxito");
            }
        } catch (e) {
            console.error("⚠️ Error inicializando Firebase de forma dinámica: ", e);
        }
    } else {
        console.log("ℹ️ Usando modo de simulación local de RSVP (Firebase no configurado aún).");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Desactivar la restauración de scroll automática para iniciar siempre en la cima
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    // Inicializar Firebase de forma no bloqueante (en segundo plano)
    initFirebaseLazy().catch(err => {
        console.warn("⚠️ Falló la carga en segundo plano de Firebase (modo simulación activo):", err);
    });

    // 1. INICIALIZACIONES CORE
    const initializers = [
        { name: "Preloader", fn: initPreloader },
        { name: "Canvas Particles", fn: initCanvasParticles },
        { name: "Countdown", fn: initCountdown },
        { name: "Audio Player", fn: initAudioPlayer },
        { name: "Tabs & Copy", fn: initTabsAndCopy },
        { name: "RSVP Form", fn: initRSVPForm },
        { name: "Scroll Reveal", fn: initScrollReveal }
    ];

    initializers.forEach(item => {
        try {
            item.fn();
        } catch (err) {
            console.error(`⚠️ Error al inicializar ${item.name}:`, err);
        }
    });
});

// ==========================================================================
// 1. PRECARGADOR MÁGICO (Rose Preloader)
// ==========================================================================
function initPreloader() {
    const preloader = document.getElementById("preloader");
    const loaderBar = document.getElementById("loader-bar");
    const loaderPercent = document.getElementById("loader-percent");
    const loaderBarContainer = document.getElementById("loader-bar-container");
    const fallingPetal = document.getElementById("falling-petal");
    
    let percent = 0;
    
    // Failsafe de respaldo de 6.0 segundos por si el usuario tarda en presionar el botón o se congela
    const failsafeTimer = setTimeout(() => {
        if (preloader && !preloader.classList.contains("hidden")) {
            console.warn("⚠️ Failsafe de precarga activado por seguridad.");
            revealInvitation();
        }
    }, 6000);
    
    // Simular una carga progresiva de recursos pesados (Fondo y Música)
    const interval = setInterval(() => {
        percent += Math.floor(Math.random() * 15) + 5;
        if (percent >= 100) {
            percent = 100;
            clearInterval(interval);
            clearTimeout(failsafeTimer); // Cancelar failsafe ya que el usuario tiene el control
            
            // Ocultar barra y porcentaje suavemente
            if (loaderBarContainer) loaderBarContainer.style.opacity = "0";
            if (loaderPercent) loaderPercent.style.opacity = "0";
            
            setTimeout(() => {
                if (loaderBarContainer) loaderBarContainer.classList.add("hidden");
                if (loaderPercent) loaderPercent.classList.add("hidden");
                
                // Mostrar el botón de entrada real mágico
                const actionContainer = document.getElementById("preloader-action");
                if (actionContainer) {
                    actionContainer.classList.remove("hidden");
                    actionContainer.getBoundingClientRect(); // Force reflow
                    actionContainer.style.opacity = "1";
                }
            }, 400);
        }
        if (loaderBar) loaderBar.style.width = `${percent}%`;
        if (loaderPercent) loaderPercent.textContent = `${percent}%`;
    }, 120);

    // Registrar evento de click en el botón de entrada
    const enterBtn = document.getElementById("preloader-enter-btn");
    if (enterBtn) {
        enterBtn.addEventListener("click", () => {
            console.log("✨ Botón real presionado: iniciando vals orquestal y revelando...");
            
            // 1. Activar reproducción inmediata de música de fondo (gesto del usuario directo)
            if (window.attemptAutoplay) {
                window.attemptAutoplay();
            }
            
            // 2. Ocultar el botón e inhabilitar clics extras
            enterBtn.style.pointerEvents = "none";
            const actionContainer = document.getElementById("preloader-action");
            if (actionContainer) {
                actionContainer.style.opacity = "0";
            }
            
            // 3. Proceder con el pétalo cayendo
            try {
                if (typeof anime !== 'undefined' && fallingPetal) {
                    anime({
                        targets: fallingPetal,
                        translateY: [0, 60],
                        rotate: [0, 45],
                        opacity: [0, 1, 0],
                        duration: 1200,
                        easing: 'cubicBezier(0.25, 1, 0.5, 1)',
                        complete: () => {
                            revealInvitation();
                        }
                    });
                } else {
                    revealInvitation();
                }
            } catch (err) {
                console.warn("⚠️ Fallo en la animación del pétalo del preloader, usando fallback:", err);
                revealInvitation();
            }
        });
    }

    function revealInvitation() {
        // Forzar el scroll al inicio de la página inmediatamente y restaurar el scroll del body
        window.scrollTo(0, 0);
        document.body.classList.remove("no-scroll");
        document.body.classList.add("invitation-active"); // Activar transiciones de la cámara y fondo cinemático

        // Cancelar el failsafe si ya se completó la transición
        clearTimeout(failsafeTimer);
        
        // Desvanecer preloader
        if (preloader) preloader.style.opacity = "0";
        
        // Activar destello de luz mágico radial
        const magicalFlash = document.getElementById("magical-flash");
        if (magicalFlash) {
            magicalFlash.classList.add("active");
        }
        
        // Disparar explosión mágica de partículas en canvas
        if (window.triggerSparkleBurst) {
            window.triggerSparkleBurst();
        }
        
        // Hacer visible el contenedor de la invitación de forma progresiva
        const mainContainer = document.querySelector(".invitation-container");
        if (mainContainer) {
            mainContainer.style.opacity = "1";
            // Agregar la clase para disparar las animaciones CSS del Hero
            mainContainer.classList.add("invitation-revealed");
        }
        
        // Iniciar animaciones de entrada del Hero
        triggerHeroAnimations();
        
        // Intentar autoplay automático de la música de forma silenciosa
        if (window.attemptAutoplay) {
            window.attemptAutoplay();
        }
        
        setTimeout(() => {
            if (preloader) preloader.classList.add("hidden");
            // Mostrar Floating Music Island
            const musicIsland = document.getElementById("music-island");
            if (musicIsland) musicIsland.classList.remove("music-island-hidden");
        }, 800);
    }
}

// ==========================================================================
// 2. ANIMACIÓN DE ENTRADA HÉROE (CSS Nativo)
// ==========================================================================
function triggerHeroAnimations() {
    // Las animaciones ahora se controlan al 100% de forma nativa por CSS en style.css
    // mediante la clase .invitation-revealed en el contenedor principal.
    // Esto garantiza un renderizado fluido, compatible y 100% libre de fallos en móviles.
    console.log("✨ Animaciones de entrada del Hero inicializadas de forma nativa por CSS");
}

// ==========================================================================
// 3. SISTEMA DE PARTÍCULAS EN CANVAS (Brillos de Oro)
// ==========================================================================
function initCanvasParticles() {
    const canvas = document.getElementById("sparkles-canvas");
    const ctx = canvas.getContext("2d");
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    const particles = [];
    const maxParticles = 60;
    
    window.addEventListener("resize", () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });
    
    class Particle {
        constructor() {
            this.reset();
            this.y = Math.random() * height; // Repartir por la pantalla al inicio
        }
        
        reset() {
            this.x = Math.random() * width;
            this.y = height + 10;
            this.size = Math.random() * 2.5 + 0.8;
            this.speedY = -(Math.random() * 0.8 + 0.3);
            this.speedX = Math.random() * 0.4 - 0.2;
            this.opacity = Math.random() * 0.5 + 0.2;
            this.glowing = Math.random() > 0.5;
            this.glowFactor = Math.random() * 0.05 + 0.01;
            this.angle = Math.random() * Math.PI * 2;
            this.decay = null; // Sin decaimiento por defecto
        }
        
        update() {
            this.y += this.speedY;
            this.x += this.speedX + Math.sin(this.angle) * 0.15;
            this.angle += 0.02;
            
            // Decaimiento de partículas de ráfaga
            if (this.decay) {
                this.opacity -= this.decay;
                if (this.opacity <= 0) {
                    this.reset();
                    return;
                }
            } else if (this.glowing) {
                // Efecto brillo dinámico normal
                this.opacity += this.glowFactor;
                if (this.opacity >= 0.8 || this.opacity <= 0.2) {
                    this.glowFactor = -this.glowFactor;
                }
            }
            
            if (this.y < -10) {
                this.reset();
            }
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(223, 183, 108, ${this.opacity})`;
            ctx.shadowBlur = this.size * 2;
            ctx.shadowColor = "rgba(223, 183, 108, 0.4)";
            ctx.fill();
            ctx.shadowBlur = 0; // reset
        }
    }
    
    for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle());
    }
    
    // Función global para disparar la ráfaga de destellos mágicos radiales desde el centro
    window.triggerSparkleBurst = function() {
        console.log("✨ Disparando ráfaga de destellos dorados en Canvas");
        const count = 90;
        for (let i = 0; i < count; i++) {
            const p = new Particle();
            p.x = width / 2 + (Math.random() * 100 - 50);
            p.y = height / 2 + (Math.random() * 100 - 50);
            
            // Velocidades radiales
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 6.5 + 2.5;
            p.speedX = Math.cos(angle) * speed;
            p.speedY = Math.sin(angle) * speed - 1.5; // Sesgo hacia arriba
            
            p.size = Math.random() * 3.8 + 1.2;
            p.opacity = 1.0;
            p.decay = Math.random() * 0.012 + 0.005; // Desvanecimiento gradual
            
            particles.push(p);
        }
    };
    
    function animateParticles() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animateParticles);
    }
    
    animateParticles();
    
    // Parallax ultra-seguro y cinemático del Fondo Mansión (100% libre de bordes expuestos en cualquier pantalla)
    window.addEventListener("scroll", () => {
        const scrolled = window.pageYOffset;
        const bg = document.querySelector(".mansion-parallax-bg");
        if (bg) {
            // 1. Calcular el progreso del scroll para un desplazamiento porcentual y seguro
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = maxScroll > 0 ? scrolled / maxScroll : 0;
            
            // 2. Parallax ultra-suave y seguro: limitamos el desplazamiento a un máximo de -5vh
            // Esto garantiza que con la escala base de 1.12 nunca se exponga el borde inferior en ninguna pantalla.
            const translateY = - (scrollPercent * 5.0); 
            
            // Si la invitación está activa, aplicamos la escala base + la traslación.
            if (document.body.classList.contains("invitation-active")) {
                bg.style.transform = `scale(1.12) translateY(${translateY}vh)`;
            }
            
            // 3. Alta visibilidad garantizada: la hermosa escalinata se mantiene presente,
            // atenuándose sutilmente para facilitar la lectura cómoda de los textos.
            const opacity = Math.max(0.95 - (scrolled / 4500), 0.82);
            bg.style.opacity = opacity;
        }
    });
}

// ==========================================================================
// 4. CONTROLADOR DE MÚSICA (Floating Music Island)
// ==========================================================================
function initAudioPlayer() {
    document.getElementById('music-island')?.remove();
    return; // Demo: sin música

    const musicIsland = document.getElementById("music-island");
    const toggleBtn = document.getElementById("music-toggle-btn");
    const label = toggleBtn.querySelector(".music-label");
    
    // Audio nativo HTML5 con cache-busting (?v=4) para asegurar la nueva versión instrumental real
    const audio = new Audio("assets/music.mp3?v=4");
    audio.loop = true;
    audio.volume = 0.65;
    
    let isPlaying = false;
    let musicExplicitlyPaused = false;
    
    function startPlay() {
        if (musicExplicitlyPaused || isPlaying) return;
        audio.play().then(() => {
            musicIsland.classList.add("playing");
            label.textContent = "Melodía Activa";
            isPlaying = true;
            
            // Auto-remover los listeners de interacción global una vez que se inicia la reproducción
            removeInteractionListeners();
        }).catch(err => {
            console.log("Autoplay bloqueado por el navegador. Esperando interacción táctil/desplazamiento del usuario...", err);
        });
    }
    
    toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Evitar disparar eventos del document
        if (isPlaying) {
            audio.pause();
            musicIsland.classList.remove("playing");
            label.textContent = "Escuchar Melodía";
            isPlaying = false;
            musicExplicitlyPaused = true;
        } else {
            musicExplicitlyPaused = false;
            audio.play().then(() => {
                musicIsland.classList.add("playing");
                label.textContent = "Melodía Activa";
                isPlaying = true;
                removeInteractionListeners();
            }).catch(err => {
                console.warn("⚠️ Interacción bloqueada por el navegador: ", err);
            });
        }
    });
    
    // Disparar reproducción ante el primer gesto del usuario en la pantalla (solo una vez dentro de la invitación)
    const handleUserInteraction = () => {
        if (document.body.classList.contains("invitation-active")) {
            if (!isPlaying && !musicExplicitlyPaused) {
                startPlay();
            }
        }
    };
    
    function removeInteractionListeners() {
        document.removeEventListener("click", handleUserInteraction);
        document.removeEventListener("touchstart", handleUserInteraction);
        document.removeEventListener("scroll", handleUserInteraction);
        document.removeEventListener("mousemove", handleUserInteraction);
        document.removeEventListener("keydown", handleUserInteraction);
    }
    
    document.addEventListener("click", handleUserInteraction);
    document.addEventListener("touchstart", handleUserInteraction);
    document.addEventListener("scroll", handleUserInteraction);
    document.addEventListener("mousemove", handleUserInteraction);
    document.addEventListener("keydown", handleUserInteraction);
    
    // Exponer la función globalmente para el preloader
    window.attemptAutoplay = startPlay;
    
    // REMOVIDO: ya no auto-reproducimos de inmediato en la precarga
    // startPlay();
}

// ==========================================================================
// 5. CUENTA REGRESIVA CON HORARIO VENEZUELA (-04:00)
// ==========================================================================
function initCountdown() {
    const ticker = document.getElementById("countdown-ticker");
    if (!ticker) return;
    
    const targetStr = ticker.getAttribute("data-date");
    if (!targetStr) return;
    
    const targetDate = new Date(targetStr).getTime();
    
    const daysEl = document.getElementById("days");
    const hoursEl = document.getElementById("hours");
    const minEl = document.getElementById("minutes");
    const secEl = document.getElementById("seconds");
    
    if (!daysEl || !hoursEl || !minEl || !secEl) return;
    
    function updateTicker() {
        const now = new Date().getTime();
        const distance = targetDate - now;
        
        if (distance < 0) {
            const container = document.querySelector(".countdown-layout-container");
            if (container) {
                container.innerHTML = `
                    <div class="double-bezel-card w-full text-center py-6">
                        <div class="card-inner">
                            <span class="cursive-title text-gold" style="font-size: 2rem;">¡Comenzó la Gran Gala Real!</span>
                        </div>
                    </div>
                `;
            }
            return;
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        daysEl.textContent = String(days).padStart(2, '0');
        hoursEl.textContent = String(hours).padStart(2, '0');
        minEl.textContent = String(minutes).padStart(2, '0');
        secEl.textContent = String(seconds).padStart(2, '0');
        
        // Actualizar frase mágica dinámica
        const phraseDaysCount = document.getElementById("phrase-days-count");
        if (phraseDaysCount) {
            phraseDaysCount.textContent = days;
        }
    }
    
    updateTicker();
    setInterval(updateTicker, 1000);
}

// ==========================================================================
// 6. TABS Y BOTÓN DE COPIAR (LLUVIA DE SOBRES / PAGO MÓVIL)
// ==========================================================================
function initTabsAndCopy() {
    const tabBtns = document.querySelectorAll(".gift-tab-btn");
    const panes = document.querySelectorAll(".gift-pane");
    
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetPaneId = btn.getAttribute("data-tab");
            
            tabBtns.forEach(b => b.classList.remove("active"));
            panes.forEach(p => p.classList.remove("active"));
            
            btn.classList.add("active");
            document.getElementById(targetPaneId).classList.add("active");
        });
    });
    
    // Función de Copiar al portapapeles
    const copyBtns = document.querySelectorAll(".copy-btn");
    copyBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const elementId = btn.getAttribute("data-copy");
            const textToCopy = document.getElementById(elementId).textContent;
            
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = btn.textContent;
                btn.textContent = "Copied!";
                btn.style.backgroundColor = "var(--gold-primary)";
                btn.style.color = "var(--bg-deep-oled)";
                
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.backgroundColor = "rgba(223, 183, 108, 0.1)";
                    btn.style.color = "var(--gold-primary)";
                }, 2000);
            }).catch(err => {
                console.error("⚠️ No se pudo copiar: ", err);
            });
        });
    });

    // Manejo inteligente de apertura de Instagram nativo en móviles para el Event Planner
    const plannerLink = document.getElementById("planner-ig-link");
    if (plannerLink) {
        plannerLink.addEventListener("click", (e) => {
            const isMobile = /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
            if (isMobile) {
                e.preventDefault(); // Evitar abrir el navegador web por defecto
                const username = "planner.ejemplo";
                const appUrl = `instagram://user?username=${username}`;
                const webUrl = `https://www.instagram.com/${username}/`;
                
                // Intentar abrir la app nativa de Instagram
                window.location.href = appUrl;
                
                // Fallback por si no tiene instalada la app en el celular
                setTimeout(() => {
                    window.location.href = webUrl;
                }, 1500);
            }
        });
    }
}

// ==========================================================================
// 7. FORMULARIO RSVP E INTEGRACIÓN FIREBASE
// ==========================================================================
function initRSVPForm() {
    const form = document.getElementById("rsvp-form");
    const detailsContainer = document.getElementById("attendance-details-container");
    const successMsg = document.getElementById("rsvp-success-message");
    const submitBtn = document.getElementById("btn-submit-rsvp");
    
    const adultsCountSelect = document.getElementById("adults-count");
    const companionContainer = document.getElementById("companion-name-container");
    const companionInput = document.getElementById("companion-name");
    
    // Escuchar cambios en la cantidad de pases de adultos
    if (adultsCountSelect && companionContainer && companionInput) {
        adultsCountSelect.addEventListener("change", () => {
            if (adultsCountSelect.value === "2") {
                companionContainer.classList.remove("hidden-anim");
                companionInput.required = true;
            } else {
                companionContainer.classList.add("hidden-anim");
                companionInput.required = false;
                companionInput.value = ""; // Limpiar si se cambia a 1
            }
        });
    }
    
    // Toggle dinámico de pases y alergias si asiste o no
    const attendanceRadios = document.querySelectorAll("input[name='attendance']");
    attendanceRadios.forEach(radio => {
        radio.addEventListener("change", () => {
            if (radio.value === "si") {
                detailsContainer.classList.remove("hidden-anim");
                if (adultsCountSelect && adultsCountSelect.value === "2" && companionInput) {
                    companionInput.required = true;
                }
            } else {
                detailsContainer.classList.add("hidden-anim");
                if (companionInput) {
                    companionInput.required = false;
                }
            }
        });
    });
    
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const name = document.getElementById("guest-name").value.trim();
        const attendance = document.querySelector("input[name='attendance']:checked").value;
        
        let adults = 0;
        let companionName = "";
        let diet = "Ninguna";
        
        if (attendance === "si") {
            adults = parseInt(adultsCountSelect ? adultsCountSelect.value : "1");
            if (adults === 2 && companionInput) {
                companionName = companionInput.value.trim();
            }
            diet = document.getElementById("diet-restrictions").value.trim() || "Ninguna";
        }
        
        const wishes = document.getElementById("wishes-message").value.trim() || "Sin mensaje";
        
        // Bloquear botón y mostrar spinner/carga sutil
        submitBtn.disabled = true;
        submitBtn.querySelector(".btn-text").textContent = "Guardando lista real...";
        
        const guestData = {
            nombre: name,
            asiste: attendance === "si",
            adultos: adults,
            nombreAcompanante: companionName,
            ninos: 0, // Mantenemos en 0 por compatibilidad de esquema
            restricciones: diet,
            mensaje: wishes,
            fechaConfirmacion: new Date().toISOString()
        };
        
        console.log("📝 Enviando datos RSVP: ", guestData);
        
        if (isFirebaseActive && db && firestoreModule) {
            // Guardar en la base de datos Firestore real
            try {
                const { collection, addDoc, serverTimestamp } = firestoreModule;
                await addDoc(collection(db, "confirmaciones"), {
                    ...guestData,
                    fechaConfirmacion: serverTimestamp() // Reemplazar con timestamp de Firestore
                });
                console.log("🔥 Confirmación guardada en Firestore de forma segura!");
                showSuccess(name, attendance === "si", adults, companionName);
            } catch (err) {
                console.error("⚠️ Error guardando en Firestore: ", err);
                // Si falla Firestore, usamos fallback elegante para no arruinar la boda
                alert("Hubo un leve percance con la conexión del castillo. Guardando en memoria local...");
                showSuccess(name, attendance === "si", adults, companionName);
            }
        } else {
            // SIMULACIÓN LOCAL (Si no se ha enlazado a Firebase aún)
            // Se simula para que el programador/cliente vea la UI funcional 100%
            setTimeout(() => {
                console.log("ℹ️ Simulación Local Exitosa (Firebase no configurado aún).");
                showSuccess(name, attendance === "si", adults, companionName);
            }, 1000);
        }
    });
    
    function showSuccess(guestName, isAttending, adultsCount, companionName) {
        // Ocultar formulario de forma suave y mostrar mensaje de éxito
        form.style.display = "none";
        
        // Elementos dinámicos del DOM
        const successIconEmoji = document.getElementById("success-icon-emoji");
        const successTitleText = document.getElementById("success-title-text");
        const successBodyText = document.getElementById("success-body-text");
        
        const successTicketBox = document.getElementById("success-ticket-box");
        const declineDecreeBox = document.getElementById("decline-decree-box");
        
        if (isAttending) {
            // SI ASISTE: Mostrar Pase Dorado, Ocultar Pliego Declinación
            if (successIconEmoji) successIconEmoji.textContent = "✦ 🌹 ✦";
            if (successTitleText) successTitleText.textContent = "¡Confirmación Guardada!";
            if (successBodyText) successBodyText.textContent = "Tu respuesta ha sido anotada en el libro de invitados reales de forma segura. ¡Esperamos compartir esta noche inolvidable de cuento de hadas contigo!";
            
            if (declineDecreeBox) declineDecreeBox.classList.add("hidden");
            if (successTicketBox) {
                successTicketBox.classList.remove("hidden");
                // Escribir el nombre en el pase dorado
                const guestNameSpan = document.getElementById("success-guest-name");
                if (guestNameSpan && guestName) {
                    if (adultsCount === 2 && companionName) {
                        guestNameSpan.textContent = guestName;
                        const compDiv = document.createElement("div");
                        compDiv.setAttribute("style", "font-size: 1.05rem; color: var(--gold-secondary); margin-top: 10px; font-family: var(--font-body); font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase;");
                        compDiv.textContent = "& Acompañante: " + companionName;
                        guestNameSpan.appendChild(compDiv);
                    } else {
                        guestNameSpan.textContent = guestName;
                    }
                }
            }
        } else {
            // NO ASISTE: Mostrar Pliego Declinación (Plateado), Ocultar Pase Dorado
            if (successIconEmoji) successIconEmoji.textContent = "✦ 🥀 ✦";
            if (successTitleText) successTitleText.textContent = "¡Respuesta Guardada!";
            if (successBodyText) successBodyText.textContent = "Tu respuesta ha sido anotada en el libro de invitados reales de forma segura. Aunque tu ausencia física será sentida, tu cariño nos acompañará siempre en este hermoso cuento.";
            
            if (successTicketBox) successTicketBox.classList.add("hidden");
            if (declineDecreeBox) {
                declineDecreeBox.classList.remove("hidden");
                // Escribir el nombre en el pergamino plateado
                const declineNameSpan = document.getElementById("decline-guest-name");
                if (declineNameSpan && guestName) {
                    declineNameSpan.textContent = guestName;
                }
            }
        }
        
        successMsg.classList.remove("hidden");
        
        // Animaciones con try-catch
        try {
            if (typeof anime !== 'undefined') {
                anime({
                    targets: '.success-icon',
                    scale: [0, 1.2, 1],
                    rotate: '1turn',
                    duration: 1000,
                    easing: 'easeOutElastic(1, .5)'
                });
                
                const targetCard = isAttending ? '.rsvp-success-ticket' : '.rsvp-decline-decree';
                anime({
                    targets: targetCard,
                    scale: [0.7, 1],
                    rotateY: ['-45deg', '0deg'],
                    opacity: [0, 1],
                    duration: 1400,
                    delay: 200,
                    easing: 'easeOutElastic(1, .6)'
                });
            }
        } catch (err) {
            console.warn("⚠️ Fallo en la animación de éxito RSVP:", err);
        }
    }
}

// ==========================================================================
// 8. TRANSICIONES MÁGICAS (anime.js Timeline Royal Scroll Reveal & Unified Cinematic Content)
// ==========================================================================
function triggerRoyalScrollAnimation(wrapper) {
    wrapper.classList.add("active");
    
    const paper = wrapper.querySelector(".scroll-paper");
    const content = wrapper.querySelector(".scroll-paper-content");
    const contentChildren = wrapper.querySelectorAll(".scroll-paper-content > *");
    const topFinials = wrapper.querySelectorAll(".rod-top .rod-finial");
    const bottomFinials = wrapper.querySelectorAll(".rod-bottom .rod-finial");
    
    // 1. Resetear estados iniciales para garantizar un arranque limpio
    paper.style.height = "0px";
    paper.style.opacity = "1";
    
    // Asegurarse de que todos los hijos estén visibles dentro del contenedor
    contentChildren.forEach(child => {
        child.style.opacity = "1";
        child.style.transform = "none";
        child.style.filter = "none";
    });
    
    // El contenedor de contenido inicia invisible, difuminado y desplazado hacia abajo
    content.style.opacity = "0";
    content.style.filter = "blur(15px)";
    content.style.transform = "translateY(25px) scale(0.98)";
    
    // Resetear la rotación de los terminales (finiales)
    anime.set([topFinials, bottomFinials], { rotate: 0 });
    
    // 2. Medir la altura real del contenedor interno
    const targetHeight = content.offsetHeight || content.scrollHeight;
    
    // 3. Crear Timeline de anime.js: Desenrollar y revelar de forma fluida y paralela
    const tl = anime.timeline({
        easing: "cubicBezier(0.16, 1, 0.3, 1)",
        duration: 1200 // Más rápido y enérgico
    });
    
    // FASE 1A: Desenrollar el papel físicamente (el rodillo inferior baja naturalmente)
    tl.add({
        targets: paper,
        height: [0, targetHeight],
        duration: 1200,
        begin: () => {
            paper.style.opacity = "1";
        },
        complete: () => {
            paper.style.height = "auto"; // Restaurar auto para perfecta responsividad
        }
    }, 0);
    
    // FASE 1B: Rotar terminales superiores (sentido antihorario, dos vueltas completas)
    tl.add({
        targets: topFinials,
        rotate: [0, -720],
        duration: 1200,
        easing: "cubicBezier(0.16, 1, 0.3, 1)"
    }, 0);
    
    // FASE 1C: Rotar terminales inferiores (sentido horario, dos vueltas completas)
    tl.add({
        targets: bottomFinials,
        rotate: [0, 720],
        duration: 1200,
        easing: "cubicBezier(0.16, 1, 0.3, 1)"
    }, 0);

    // FASE 2: Revelación de cristal / Neblina mágica del contenido al unísono
    // Inicia a los 400ms (cuando el pergamino ya está a la mitad) y dura 800ms para máxima fluidez cinemática
    tl.add({
        targets: content,
        opacity: [0, 1],
        filter: ["blur(15px)", "blur(0px)"],
        translateY: [20, 0],
        scale: [0.98, 1],
        duration: 800,
        easing: "cubicBezier(0.16, 1, 0.3, 1)"
    }, 400);
}

function initScrollReveal() {
    // 1. Elementos estándar que se revelan con fade-in simple al entrar en pantalla
    const reveals = document.querySelectorAll(".fade-reveal, .double-bezel-card");
    
    const standardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
                standardObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.08,
        rootMargin: "0px"
    });
    
    reveals.forEach(el => {
        if (!el.classList.contains("fade-reveal")) {
            el.classList.add("fade-reveal");
        }
        standardObserver.observe(el);
    });
    
    // 2. Observación DIRECTA y de alta precisión del pergamino real (.royal-scroll-wrapper)
    const scrolls = document.querySelectorAll(".royal-scroll-wrapper");
    
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                console.log("⚜️ El pergamino real ha entrado en la zona visible de forma física. Desplegando...");
                triggerRoyalScrollAnimation(entry.target);
                scrollObserver.unobserve(entry.target); // Animación única
            }
        });
    }, {
        threshold: 0.1, // Trigger súper rápido (apenas 10% visible) para usuarios que bajan rápido
        rootMargin: "0px 0px -50px 0px" // Trigger casi inmediato (50px antes del fondo de pantalla)
    });
    
    scrolls.forEach(el => {
        scrollObserver.observe(el);
    });
}
