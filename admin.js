// ==========================================================================
// CONTROLADOR ADMINISTRATIVO - CORTEJO DE VALENTINA EJEMPLO
// ==========================================================================


// CONFIGURACIÓN DE FIREBASE (Idéntica a la de la invitación)
const firebaseConfig = { apiKey: "SITUAR_AQUI_API_KEY_SI_SE_DESEA" }; // DEMO: sin backend

let db = null;
let auth = null;
let isFirebaseActive = false;
let allConfirmations = []; // Almacén en memoria para búsquedas y exportación PDF
let currentPage = 1;
const itemsPerPage = 5;
let currentFilteredData = []; // Para trackear la lista filtrada al paginar

// Intentar conectar con Firebase
if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "SITUAR_AQUI_API_KEY_SI_SE_DESEA") {
    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        isFirebaseActive = true;
    } catch (e) {
        console.error("⚠️ Error inicializando Firebase en Admin: ", e);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initAdminCanvas();
    setupAdminPortal();
});

// ==========================================================================
// 1. CONTROL DE ACCESO (AUTHENTICATION GATE)
// ==========================================================================
function setupAdminPortal() {
    const loginGate = document.getElementById("login-gate");
    const dashboard = document.getElementById("admin-dashboard");
    const loginForm = document.getElementById("login-form");
    const loginError = document.getElementById("login-error-msg");
    const logoutBtn = document.getElementById("btn-logout");
    const searchInput = document.getElementById("admin-search-input");
    const exportBtn = document.getElementById("btn-export-pdf");

    if (isFirebaseActive && auth) {
        // ESCUCHA DE AUTENTICACIÓN FIREBASE REAL
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // Sesión iniciada
                loginGate.classList.add("hidden");
                dashboard.classList.remove("hidden");
                loadRSVPRealtimeData();
            } else {
                // Sesión cerrada
                loginGate.classList.remove("hidden");
                dashboard.classList.add("hidden");
            }
        });

        // Evento de Login
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("admin-email").value.trim();
            const pass = document.getElementById("admin-password").value;

            try {
                loginError.classList.add("hidden");
                await signInWithEmailAndPassword(auth, email, pass);
            } catch (err) {
                console.error("⚠️ Error de autenticación: ", err);
                loginError.textContent = "Contraseña o credencial real incorrecta.";
                loginError.classList.remove("hidden");
            }
        });

        // Evento de Logout
        logoutBtn.addEventListener("click", () => {
            signOut(auth);
        });

    } else {
        // MODO DEMOSTRACIÓN LOCAL (Si no se ha enlazado a Firebase aún)
        // Permite probar y validar la interfaz del admin con un usuario ficticio
        console.warn("ℹ️ Corriendo Admin en MODO DEMO. Usa cualquier correo/contraseña para probar.");
        
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = document.getElementById("admin-email").value.trim();
            
            // Simular inicio de sesión
            loginGate.classList.add("hidden");
            dashboard.classList.remove("hidden");
            loadDemoRSVPData();
        });
        
        logoutBtn.addEventListener("click", () => {
            loginGate.classList.remove("hidden");
            dashboard.classList.add("hidden");
            allConfirmations = [];
        });
    }

    // Filtro de búsqueda en tiempo real
    searchInput.addEventListener("input", (e) => {
        // Filtrar dinámicamente respetando el filtro bento activo
        calculateStatsAndRender(allConfirmations);
    });

    // Tareas e interacciones de filtrado Bento (Total, Confirmados, Acompañantes, Alergias)
    const cardTotal = document.querySelector(".card-total");
    const cardAdults = document.querySelector(".card-adults");
    const cardCompanions = document.querySelector(".card-companions");
    const cardAllergies = document.querySelector(".card-allergies");

    function applyBentoFilter(activeCard) {
        document.querySelectorAll(".stat-card").forEach(card => card.classList.remove("active"));
        if (activeCard) {
            activeCard.classList.add("active");
        }
        calculateStatsAndRender(allConfirmations);
    }

    if (cardTotal) {
        cardTotal.addEventListener("click", () => {
            if (searchInput) searchInput.value = ""; // Limpiar buscador al cambiar categoría para mejor UX
            applyBentoFilter(cardTotal);
        });
    }

    if (cardAdults) {
        cardAdults.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";
            applyBentoFilter(cardAdults);
        });
    }

    if (cardCompanions) {
        cardCompanions.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";
            applyBentoFilter(cardCompanions);
        });
    }

    if (cardAllergies) {
        cardAllergies.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";
            applyBentoFilter(cardAllergies);
        });
    }

    // Exportar a PDF
    exportBtn.addEventListener("click", () => {
        exportGuestsToPDF();
    });
}

// ==========================================================================
// 2. CONEXIÓN A FIRESTORE Y ACTUALIZACIÓN EN TIEMPO REAL
// ==========================================================================
function loadRSVPRealtimeData() {
    const q = query(collection(db, "confirmaciones"), orderBy("fechaConfirmacion", "desc"));
    
    // Escucha asíncrona de Firestore (Notifica y actualiza al instante!)
    onSnapshot(q, (snapshot) => {
        allConfirmations = [];
        snapshot.forEach((doc) => {
            allConfirmations.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        calculateStatsAndRender(allConfirmations);
    }, (err) => {
        console.error("⚠️ Error cargando Firestore: ", err);
    });
}

// ==========================================================================
// 3. GENERACIÓN DE DATOS MOCK/DEMO (Para prueba local inmediata)
// ==========================================================================
function loadDemoRSVPData() {
    allConfirmations = [
        { nombre: "Pedro Ejemplo", asiste: true, adultos: 2, nombreAcompanante: "Ana de Ejemplo", restricciones: "Ninguna", mensaje: "¡Muchas bendiciones Valentina en tus 15 años! Qué gran cuento de hadas.", fechaConfirmacion: "2027-05-28T10:15:30Z" },
        { nombre: "María Muestra", asiste: true, adultos: 1, nombreAcompanante: "", restricciones: "Celíaca (Sin gluten)", mensaje: "Muy feliz de acompañarte en tu gran vals imperial.", fechaConfirmacion: "2027-05-28T09:20:00Z" },
        { nombre: "Juan Carlos Prueba", asiste: false, adultos: 0, nombreAcompanante: "", restricciones: "Ninguna", mensaje: "Lamentablemente no estaré en el país, pero les envío un gran abrazo.", fechaConfirmacion: "2027-05-27T18:45:10Z" },
        { nombre: "Laura Demo", asiste: true, adultos: 2, nombreAcompanante: "Sofía Demo", restricciones: "Ninguna", mensaje: "¡Ahí estaremos luciendo nuestras mejores galas!", fechaConfirmacion: "2027-05-27T14:12:00Z" }
    ];
    calculateStatsAndRender(allConfirmations);
}

// ==========================================================================
// 4. RENDERS Y CÁLCULOS ESTADÍSTICOS
// ==========================================================================
function calculateStatsAndRender(data) {
    let totalGuests = 0;
    let totalConfirmations = 0;
    let totalCompanions = 0;
    let totalAllergies = 0;

    data.forEach(c => {
        if (c.asiste) {
            totalConfirmations++;
            const pases = parseInt(c.adultos) || 1;
            totalGuests += pases;
            if (c.restricciones && c.restricciones.toLowerCase() !== "ninguna" && c.restricciones.trim() !== "") {
                totalAllergies++;
            }
        }
    });
    
    // Los acompañantes son la diferencia real entre invitados totales confirmados y pases principales
    totalCompanions = totalGuests - totalConfirmations;
    if (totalCompanions < 0) totalCompanions = 0;

    // Actualizar paneles Bento de Admin
    document.getElementById("stat-total-guests").textContent = totalGuests;
    document.getElementById("stat-adults").textContent = totalConfirmations;
    document.getElementById("stat-companions").textContent = totalCompanions;
    document.getElementById("stat-allergies").textContent = totalAllergies;

    // Determinar qué filtro bento está activo actualmente y filtrar los datos a renderizar
    const activeCard = document.querySelector(".stat-card.active");
    let dataToRender = data;
    
    if (activeCard) {
        if (activeCard.classList.contains("card-adults")) {
            dataToRender = data.filter(c => c.asiste === true);
        } else if (activeCard.classList.contains("card-companions")) {
            dataToRender = data.filter(c => c.asiste === true && (parseInt(c.adultos) > 1));
        } else if (activeCard.classList.contains("card-allergies")) {
            dataToRender = data.filter(c => c.asiste === true && c.restricciones && c.restricciones.toLowerCase() !== "ninguna" && c.restricciones.trim() !== "");
        } else {
            // card-total muestra todos los registros (asistentes y declinados)
            dataToRender = data;
        }
    } else {
        // Activar la tarjeta total por defecto si no hay ninguna activa
        const cardTotal = document.querySelector(".card-total");
        if (cardTotal) cardTotal.classList.add("active");
        dataToRender = data;
    }

    // Si hay un término de búsqueda en el buscador, filtrar también por eso
    const searchInput = document.getElementById("admin-search-input");
    if (searchInput && searchInput.value.trim() !== "") {
        const queryStr = searchInput.value.toLowerCase().trim();
        dataToRender = dataToRender.filter(c => c.nombre.toLowerCase().includes(queryStr));
    }

    currentPage = 1;
    renderTable(dataToRender);
}

function renderTable(data) {
    const container = document.getElementById("guests-cards-container");
    const paginationContainer = document.getElementById("admin-pagination");
    if (!container) return;
    
    // Almacenar la referencia actual de los datos filtrados
    currentFilteredData = data;
    
    if (data.length === 0) {
        container.innerHTML = `<div class="table-empty-state">No se encontraron confirmaciones registradas.</div>`;
        if (paginationContainer) paginationContainer.innerHTML = "";
        return;
    }

    // Cálculos de paginación
    const totalPages = Math.ceil(data.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages || 1;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pagedData = data.slice(startIndex, endIndex);

    container.innerHTML = "";
    pagedData.forEach((c, index) => {
        const globalIndex = startIndex + index;
        const attendanceBadge = c.asiste 
            ? `<span class="badge-si">CONFIRMADO</span>` 
            : `<span class="badge-no">NO ASISTE</span>`;
            
        // Royal Wax Seal SVG (Crimson Red for Confirmed, Bronze/Silver for Declined)
        const sealId = `seal-grad-${globalIndex}`;
        const shadowId = `seal-shadow-${globalIndex}`;
        const waxSealSvg = c.asiste 
            ? `<div class="wax-seal-badge-wrapper">
                <svg class="wax-seal-badge-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <radialGradient id="${sealId}" cx="40%" cy="40%" r="60%">
                            <stop offset="0%" stop-color="#ff4d4d"/>
                            <stop offset="70%" stop-color="#a80a0a"/>
                            <stop offset="100%" stop-color="#540000"/>
                        </radialGradient>
                        <filter id="${shadowId}" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="1" dy="3" stdDeviation="2" flood-color="#000000" flood-opacity="0.55"/>
                        </filter>
                    </defs>
                    <!-- Irregular outer wax drop shape -->
                    <path d="M 50,6 C 68,5 92,15 94,32 C 96,50 90,68 82,82 C 70,92 50,96 34,92 C 16,88 6,70 6,52 C 6,34 18,18 32,8 C 40,3 42,7 50,6 Z" fill="url(#${sealId})" filter="url(#${shadowId})"/>
                    <!-- Inner ring -->
                    <circle cx="50" cy="50" r="30" fill="none" stroke="#540000" stroke-width="2.5" opacity="0.6"/>
                    <circle cx="50" cy="50" r="28" fill="none" stroke="#ff9999" stroke-width="0.8" opacity="0.3"/>
                    <path d="M 32,25 C 45,15 65,15 72,24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.25" filter="blur(1px)"/>
                    <!-- Embossed Fleur-de-lis -->
                    <g fill="#420000" opacity="0.8" transform="translate(34, 30) scale(1.35)">
                        <path d="M12 2C12 2 9 6 9 9C9 12 11 13 12 14C13 13 15 12 15 9C15 6 12 2 12 2Z"/>
                        <path d="M12 14C9 14 6 17 6 22H18C18 17 15 14 12 14Z"/>
                        <path d="M12 13.5C10.5 13.5 8 14.5 8 14.5C8 14.5 10 16 12 16C14 16 16 14.5 16 14.5C16 14.5 13.5 13.5 12 13.5Z"/>
                    </g>
                </svg>
               </div>`
            : `<div class="wax-seal-badge-wrapper">
                <svg class="wax-seal-badge-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <radialGradient id="${sealId}" cx="40%" cy="40%" r="60%">
                            <stop offset="0%" stop-color="#ffffff"/>
                            <stop offset="60%" stop-color="#b0b5c0"/>
                            <stop offset="100%" stop-color="#5c6370"/>
                        </radialGradient>
                        <filter id="${shadowId}" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="1" dy="3" stdDeviation="2" flood-color="#000000" flood-opacity="0.55"/>
                        </filter>
                    </defs>
                    <!-- Irregular outer wax drop shape -->
                    <path d="M 48,8 C 66,5 88,14 92,30 C 96,48 88,66 80,80 C 68,90 48,94 32,90 C 14,86 4,68 4,50 C 4,32 16,16 30,6 C 38,1 40,9 48,8 Z" fill="url(#${sealId})" filter="url(#${shadowId})"/>
                    <!-- Inner ring -->
                    <circle cx="50" cy="50" r="30" fill="none" stroke="#4b5563" stroke-width="2.5" opacity="0.6"/>
                    <circle cx="50" cy="50" r="28" fill="none" stroke="#ffffff" stroke-width="0.8" opacity="0.3"/>
                    <path d="M 32,25 C 45,15 65,15 72,24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.35" filter="blur(1px)"/>
                    <!-- Embossed Cancelled Cross -->
                    <g stroke="#374151" stroke-width="4.5" stroke-linecap="round" opacity="0.7" transform="translate(35, 35) scale(0.7)">
                        <line x1="5" y1="5" x2="35" y2="35" />
                        <line x1="35" y1="5" x2="5" y2="35" />
                    </g>
                </svg>
               </div>`;

        // Contenido de pases
        let passesInfo = "";
        if (c.asiste) {
            const numPases = parseInt(c.adultos) || 1;
            if (numPases > 1) {
                const companionText = c.nombreAcompanante ? ` (Acomp: ${escapeHtml(c.nombreAcompanante)})` : '';
                passesInfo = `<span class="guest-passes">👥 ${numPases} Pases${companionText}</span>`;
            } else {
                passesInfo = `<span class="guest-passes">👥 1 Pase (Individual)</span>`;
            }
        } else {
            passesInfo = `<span class="guest-passes" style="color: #6b7280;">Sin pases reales</span>`;
        }

        // Contenido de alergias / restricciones
        let restrictionsInfo = "";
        if (c.asiste && c.restricciones && c.restricciones.toLowerCase() !== "ninguna" && c.restricciones.trim() !== "") {
            restrictionsInfo = `<div class="guest-diet-warning">⚠️ Dieta: ${escapeHtml(c.restricciones)}</div>`;
        }

        // Contenido de mensaje
        let messageBlock = "";
        if (c.mensaje && c.mensaje.toLowerCase() !== "sin mensaje" && c.mensaje.trim() !== "") {
            messageBlock = `<div class="guest-msg-quote">“${escapeHtml(c.mensaje)}”</div>`;
        }

        const card = document.createElement("div");
        card.className = "guest-card-item";
        card.innerHTML = `
            ${waxSealSvg}
            <div class="guest-card-header">
                <h3 class="guest-card-name">${escapeHtml(c.nombre)}</h3>
                ${attendanceBadge}
            </div>
            <div class="guest-card-body">
                ${passesInfo}
                ${restrictionsInfo}
                ${messageBlock}
            </div>
        `;
        container.appendChild(card);
    });

    // Renderizar controles de paginación
    if (paginationContainer) {
        if (totalPages <= 1) {
            paginationContainer.innerHTML = "";
        } else {
            // Conversor a números romanos para el toque heráldico gótico
            const getRomanNumeral = (num) => {
                const romanMap = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
                let roman = "";
                for (let key in romanMap) {
                    while (num >= romanMap[key]) {
                        roman += key;
                        num -= romanMap[key];
                    }
                }
                return roman;
            };

            const romanPage = getRomanNumeral(currentPage);
            const romanTotal = getRomanNumeral(totalPages);

            paginationContainer.innerHTML = `
                <button class="pagination-btn" id="btn-page-prev" ${currentPage === 1 ? 'disabled' : ''}>
                    ← Pliego Ant.
                </button>
                <span class="pagination-info">Pliego ${romanPage} / ${romanTotal}</span>
                <button class="pagination-btn" id="btn-page-next" ${currentPage === totalPages ? 'disabled' : ''}>
                    Pliego Sig. →
                </button>
            `;

            // Vincular eventos de click
            document.getElementById("btn-page-prev").addEventListener("click", () => {
                if (currentPage > 1) {
                    currentPage--;
                    renderTable(currentFilteredData);
                    const scrollTarget = document.querySelector('.table-controls');
                    if (scrollTarget) {
                        window.scrollTo({ top: scrollTarget.offsetTop - 20, behavior: 'smooth' });
                    }
                }
            });

            document.getElementById("btn-page-next").addEventListener("click", () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    renderTable(currentFilteredData);
                    const scrollTarget = document.querySelector('.table-controls');
                    if (scrollTarget) {
                        window.scrollTo({ top: scrollTarget.offsetTop - 20, behavior: 'smooth' });
                    }
                }
            });
        }
    }
}

function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==========================================================================
// 5. EXPORTAR A PDF PROFESIONAL CON jspdf Y autotable
// ==========================================================================
function exportGuestsToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Orientación horizontal (Landscape)
    
    // Obtener estadísticas actuales
    const total = document.getElementById("stat-total-guests").textContent;
    const adults = document.getElementById("stat-adults").textContent;
    const companions = document.getElementById("stat-companions").textContent;
    const allergies = document.getElementById("stat-allergies").textContent;
    
    // 1. Encabezado Premium con Filo de Oro
    doc.setFillColor(2, 2, 5); // Fondo azul muy oscuro
    doc.rect(0, 0, 297, 45, 'F');
    
    doc.setDrawColor(223, 183, 108); // Borde dorado
    doc.setLineWidth(1.5);
    doc.line(0, 45, 297, 45);
    
    // Títulos de Encabezado
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(223, 183, 108); // Oro
    doc.text("VALENTINA EJEMPLO", 15, 20);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(13);
    doc.setTextColor(245, 228, 189); // Oro suave
    doc.text("CORTEJO REAL · LISTA OFICIAL DE INVITADOS", 15, 28);
    
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175); // Muted grey
    const printDate = new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' });
    doc.text(`Impreso desde el Palacio: ${printDate} (Hora Venezuela)`, 15, 37);

    // Resumen Bento de Estadísticas en el PDF
    doc.setFillColor(30, 31, 46); // Caja de resumen
    doc.roundedRect(170, 10, 110, 28, 3, 3, 'F');
    doc.setFontSize(8.5);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(245, 228, 189);
    doc.text("CONSOLIDADO REAL DE ASISTENCIA:", 175, 17);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`* Total Invitados: ${total} personas`, 175, 24);
    doc.text(`* Pases Titulares: ${adults} | Acompañantes: ${companions}`, 175, 29);
    doc.text(`* Dietas Especiales / Alergias: ${allergies}`, 175, 34);

    // 2. Compilar Datos de la Tabla
    const tableBody = allConfirmations.map((c, index) => {
        return [
            c.nombre,
            c.asiste ? "SÍ, ASISTIRÁ" : "NO ASISTE",
            c.asiste ? `${c.adultos} Pase(s)` : "-",
            c.asiste ? (c.nombreAcompanante || "-") : "-",
            c.restricciones || "Ninguna",
            c.mensaje || "Sin mensaje"
        ];
    });

    // 3. Generar la Tabla con Estilo de Alta Gama
    doc.autoTable({
        startY: 55,
        head: [['Invitado Principal', 'Asistencia', 'Pases', 'Acompañante', 'Dieta / Alergias', 'Mensaje Especial']],
        body: tableBody,
        theme: 'striped',
        headStyles: {
            fillColor: [124, 88, 44], // Café dorado barroco
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9
        },
        bodyStyles: {
            fontSize: 8.5,
            textColor: [40, 40, 40]
        },
        columnStyles: {
            0: { fontStyle: 'bold', width: 55 },
            1: { width: 30 },
            2: { width: 18, halign: 'center' },
            3: { width: 18, halign: 'center' },
            4: { width: 45 },
            5: { cellWidth: 'wrap' }
        },
        styles: {
            overflow: 'linebreak',
            cellPadding: 4
        },
        margin: { left: 15, right: 15 }
    });

    // Guardar el PDF con nombre representativo
    doc.save("Invitados_Valentina_Ejemplo.pdf");
}

// ==========================================================================
// 6. CANVAS DE BRILLOS DE ORO ADMINISTRADOR (Idéntico a index para cohesión visual)
// ==========================================================================
function initAdminCanvas() {
    const canvas = document.getElementById("sparkles-canvas");
    const ctx = canvas.getContext("2d");
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    const particles = [];
    const maxParticles = 40;
    
    window.addEventListener("resize", () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });
    
    class Particle {
        constructor() {
            this.reset();
            this.y = Math.random() * height;
        }
        reset() {
            this.x = Math.random() * width;
            this.y = height + 10;
            this.size = Math.random() * 2 + 0.5;
            this.speedY = -(Math.random() * 0.5 + 0.2);
            this.speedX = Math.random() * 0.2 - 0.1;
            this.opacity = Math.random() * 0.4 + 0.1;
        }
        update() {
            this.y += this.speedY;
            this.x += this.speedX;
            if (this.y < -10) this.reset();
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(223, 183, 108, ${this.opacity})`;
            ctx.fill();
        }
    }
    
    for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle());
    }
    
    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }
    animate();
}
