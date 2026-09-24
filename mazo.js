// Lógica del mazo de cartas, compartida por todas las categorías.
// - Mazo del Deseo: cartas desde cards.json (requiere abrir la app desde un servidor, no con doble clic).
// - Vida laboral / cotidiana / en pareja: cartas armadas a partir de `preguntas` (datos.js).
// Usa mostrarPantalla, aplicarTema y volverAlMenu de codigo.js, y activarAlertaReto/desactivarAlertaReto de efecto.js.

const TIPOS_CARTA = { pregunta: "💬 Pregunta", reto: "🔥 Reto", fantasia: "🎭 Fantasía", situacion: "🤔 Situación" };

// Configuración de cada mazo: tema de fondo, ícono del dorso y de dónde salen las cartas
const MAZOS = {
    laboral: { titulo: "VIDA LABORAL",   tema: "laboral", icono: "💼", colores: ["#93c5fd", "#60a5fa", "#3b82f6", "#a78bfa"] },
    vida:    { titulo: "VIDA COTIDIANA", tema: "vida",    icono: "☕", colores: ["#86efac", "#4ade80", "#22c55e", "#facc15"] },
    parejas: { titulo: "VIDA EN PAREJA", tema: "parejas", icono: "💞", colores: ["#fdba74", "#fb923c", "#f43f5e", "#e879f9"] },
    deseo:   { titulo: "MAZO DEL DESEO", tema: "deseo",   icono: "♥",  archivo: "cards.json", aviso18: true }
};

// Niveles de las categorías que usan datos.js (el 4 es "¿Qué harías?")
const NIVELES_PREGUNTAS = [
    { id: 1, nombre: "Nivel 1",      descripcion: "Preguntas livianas para arrancar." },
    { id: 2, nombre: "Nivel 2",      descripcion: "Un poco más profundo." },
    { id: 3, nombre: "Nivel 3",      descripcion: "Preguntas intensas, para ir a fondo." },
    { id: 4, nombre: "¿Qué harías?", descripcion: "Situaciones para imaginar y debatir." }
];
const CIRCUNFERENCIA_TIMER = 2 * Math.PI * 44; // radio del círculo SVG del timer
const UMBRAL_SWIPE = 70;                         // px de arrastre horizontal para pasar la carta

let mazoClave = null;        // mazo abierto: "laboral", "vida", "parejas" o "deseo"
let mazoDatos = null;        // niveles y cartas del mazo abierto
const mazosCargados = {};    // caché por clave, para no volver a armar/descargar
let mazoAvisoAceptado = false; // aviso +18 aceptado en esta sesión (solo en memoria)
let mazoPalabraPausa = "";
let mazoModo = null;         // id de nivel (1-5), "progresivo" o "sorpresa"
let mazoCartas = [];         // cartas que quedan por salir
let mazoNivelesEnJuego = []; // ids de nivel que forman el mazo actual
let mazoTotal = 0;
let mazoCartaActual = null;
let mazoVolteada = false;
let mazoAnimando = false;    // true mientras la carta sale de la mesa (evita dobles toques)
let mazoTimeoutAnimacion = null;

let mazoIntervalo = null;
let mazoTiempoTotal = 0;
let mazoTiempoRestante = 0;

// ================= CARGA DE DATOS =================

async function cargarMazo(clave) {
    if (mazosCargados[clave]) return mazosCargados[clave];

    const config = MAZOS[clave];
    let datos;
    if (config.archivo) {
        const resp = await fetch(config.archivo);
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        datos = await resp.json();
    } else {
        datos = armarMazoDesdePreguntas(clave, config.colores);
    }

    mazosCargados[clave] = datos;
    return datos;
}

/**
 * Convierte preguntas[categoria] de datos.js al formato de cartas del mazo.
 */
function armarMazoDesdePreguntas(categoria, colores) {
    const niveles = NIVELES_PREGUNTAS.map((n, i) => ({ ...n, color: colores[i] }));
    const cartas = niveles.flatMap(n =>
        (preguntas[categoria][n.id] || []).map((texto, i) => ({
            id: categoria + "-" + n.id + "-" + (i + 1),
            nivel: n.id,
            tipo: n.id === 4 ? "situacion" : "pregunta",
            texto: texto,
            tiempo: null
        }))
    );
    return { niveles, cartas };
}

function buscarNivel(id) {
    return mazoDatos.niveles.find(n => n.id === id);
}

/** Nombre del nivel con su intensidad en ají (🌶️ a 🌶️🌶️🌶️🌶️🌶️), si la tiene. */
function nombreConAjies(nivel) {
    return (nivel.nombre + " " + "🌶️".repeat(nivel.picante || 0)).trim();
}

// ================= MENÚ DEL MAZO =================

/**
 * Abre un mazo: aplica su tema, carga las cartas y muestra los niveles.
 * El Mazo del Deseo pide antes el aviso +18 (una vez por sesión).
 * @param {string} clave - "laboral", "vida", "parejas" o "deseo".
 */
async function abrirMazo(clave) {
    const config = MAZOS[clave];
    mazoClave = clave;
    mazoDatos = null;

    desactivarAlertaReto();
    aplicarTema(config.tema);
    document.getElementById("titulo-mazo").textContent = config.titulo;
    document.getElementById("dorso-logo").textContent = config.icono;
    document.getElementById("mazo-palabra-pausa").classList.toggle("oculto", !config.aviso18 || !mazoAvisoAceptado);
    mostrarPantalla("menu-mazo");

    const contenedor = document.getElementById("mazo-niveles");
    contenedor.textContent = "Cargando cartas…";

    try {
        const datos = await cargarMazo(clave);
        if (mazoClave !== clave) return; // cambiaron de mazo mientras cargaba
        mazoDatos = datos;

        if (config.aviso18 && !mazoAvisoAceptado) {
            mostrarAvisoMazo(datos);
            return;
        }

        contenedor.textContent = "";

        datos.niveles.forEach(nivel => {
            const cantidad = datos.cartas.filter(c => c.nivel === nivel.id).length;
            contenedor.appendChild(crearBotonNivel(
                nivel.id + ". " + nombreConAjies(nivel),
                nivel.descripcion + " (" + cantidad + " cartas)",
                nivel.color,
                () => iniciarMazo(nivel.id)
            ));
        });

        contenedor.appendChild(crearBotonNivel(
            "Progresivo",
            "Todas las cartas, del nivel 1 al " + datos.niveles.length + " (" + datos.cartas.length + " cartas)",
            "#f5f5f5",
            () => iniciarMazo("progresivo")
        ));

        contenedor.appendChild(crearBotonNivel(
            "Sorpresa",
            "Todas las cartas mezcladas al azar (" + datos.cartas.length + " cartas)",
            "#f5f5f5",
            () => iniciarMazo("sorpresa")
        ));
    } catch (e) {
        contenedor.textContent =
            "No se pudieron cargar las cartas. Si abriste index.html con doble clic, el navegador bloquea la lectura: " +
            "abrí la app desde un servidor local (por ejemplo, Live Server en VS Code o \"npx serve\").";
        console.error("Error cargando el mazo " + clave + ":", e);
    }
}

function mostrarAvisoMazo(datos) {
    const lista = document.getElementById("mazo-reglas");
    lista.textContent = "";
    datos.reglas.forEach(regla => {
        const li = document.createElement("li");
        li.textContent = regla;
        lista.appendChild(li);
    });

    document.getElementById("acepto-mazo").checked = false;
    document.getElementById("btn-aceptar-mazo").disabled = true;
    mostrarPantalla("aviso-mazo");
}

function aceptarAvisoMazo() {
    if (!document.getElementById("acepto-mazo").checked) return;

    mazoAvisoAceptado = true;
    mazoPalabraPausa = document.getElementById("palabra-pausa").value.trim() || "Pausa";
    document.getElementById("mazo-palabra-pausa").textContent =
        "⏸ Pausa: «" + mazoPalabraPausa + "»";
    abrirMazo(mazoClave);
}

function crearBotonNivel(titulo, detalle, color, alHacerClic) {
    const btn = document.createElement("button");
    btn.className = "btn-nivel-mazo";
    btn.style.setProperty("--nivel-color", color);

    const t = document.createElement("strong");
    t.textContent = titulo;
    const d = document.createElement("small");
    d.textContent = detalle;

    btn.append(t, d);
    btn.addEventListener("click", alHacerClic);
    return btn;
}

// ================= ARMADO DEL MAZO =================

/** Mezcla un array in-place (Fisher-Yates). */
function mezclar(lista) {
    for (let i = lista.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lista[i], lista[j]] = [lista[j], lista[i]];
    }
    return lista;
}

/**
 * Arma y mezcla el mazo.
 * @param {number|string} modo - id de nivel; "progresivo" (mezcla dentro de cada nivel y los ordena de 1 a 5)
 *                              o "sorpresa" (todas las cartas mezcladas).
 */
function iniciarMazo(modo) {
    mazoModo = modo;

    if (modo === "progresivo") {
        mazoCartas = mazoDatos.niveles.flatMap(n =>
            mezclar(mazoDatos.cartas.filter(c => c.nivel === n.id))
        );
        document.getElementById("mazo-nivel-nombre").textContent = "Progresivo";
    } else if (modo === "sorpresa") {
        mazoCartas = mezclar([...mazoDatos.cartas]);
        document.getElementById("mazo-nivel-nombre").textContent = "Sorpresa";
    } else {
        mazoCartas = mezclar(mazoDatos.cartas.filter(c => c.nivel === modo));
        document.getElementById("mazo-nivel-nombre").textContent = buscarNivel(modo).nombre;
    }

    mazoNivelesEnJuego = [...new Set(mazoCartas.map(c => c.nivel))].sort((a, b) => a - b);
    mazoTotal = mazoCartas.length;
    mostrarPantalla("pantalla-mazo");
    prepararSiguienteCarta();
}

/**
 * Deja la próxima carta boca abajo arriba de la pila.
 */
function prepararSiguienteCarta() {
    cancelarAnimacionPendiente();
    detenerTimerMazo();
    desactivarAlertaReto();

    const carta = document.getElementById("carta");
    const btnSiguiente = document.getElementById("btn-siguiente-carta");

    // Resetea la carta sin animar el giro, para no mostrar el texto nuevo durante la vuelta
    carta.classList.add("sin-transicion");
    carta.classList.remove("volteada", "descartada", "entrando");
    void carta.offsetWidth;
    carta.classList.remove("sin-transicion");

    document.getElementById("mazo-controles-timer").classList.add("oculto");
    btnSiguiente.disabled = true;
    btnSiguiente.textContent = "Siguiente carta";

    if (mazoCartas.length === 0) {
        mostrarFinDelMazo();
        return;
    }

    mazoCartaActual = mazoCartas.shift();
    mazoVolteada = false;

    const nivel = buscarNivel(mazoCartaActual.nivel);
    carta.style.setProperty("--nivel-color", nivel.color);
    document.getElementById("carta-nivel").textContent = nombreConAjies(nivel);
    document.getElementById("carta-tipo").textContent = TIPOS_CARTA[mazoCartaActual.tipo] || mazoCartaActual.tipo;
    document.getElementById("carta-texto").textContent = mazoCartaActual.texto;

    const timer = document.getElementById("carta-timer");
    if (mazoCartaActual.tiempo) {
        mazoTiempoTotal = mazoCartaActual.tiempo;
        mazoTiempoRestante = mazoTiempoTotal;
        actualizarTimerMazo();
        timer.classList.remove("oculto");
    } else {
        timer.classList.add("oculto");
    }

    actualizarContadorMazo();
    actualizarBotonSubirNivel();
    carta.classList.add("entrando");
}

/**
 * "Subir nivel" solo tiene sentido si hay un nivel siguiente: no aplica en Sorpresa ni en el nivel 5.
 */
function actualizarBotonSubirNivel() {
    const btn = document.getElementById("btn-subir-nivel");
    const hayNivelSiguiente = mazoCartaActual && mazoCartaActual.nivel < mazoDatos.niveles.length;
    btn.classList.toggle("oculto", mazoModo === "sorpresa" || !hayNivelSiguiente);
}

/**
 * Salta al nivel siguiente. En Progresivo descarta lo que queda del nivel actual;
 * en un nivel suelto arma el mazo del nivel siguiente.
 */
function subirNivelMazo() {
    if (!mazoCartaActual || mazoAnimando) return;
    const nivelActual = mazoCartaActual.nivel;

    detenerTimerMazo();
    desactivarAlertaReto();
    bloquearControlesCarta();
    document.getElementById("carta").classList.add("descartada");

    if (mazoModo === "progresivo") {
        const antes = mazoCartas.length;
        mazoCartas = mazoCartas.filter(c => c.nivel > nivelActual);
        mazoTotal -= antes - mazoCartas.length;
        mazoTimeoutAnimacion = setTimeout(prepararSiguienteCarta, 350);
    } else {
        mazoTimeoutAnimacion = setTimeout(() => iniciarMazo(nivelActual + 1), 350);
    }
}

function mostrarFinDelMazo() {
    mazoCartaActual = null;
    const carta = document.getElementById("carta");

    carta.style.setProperty("--nivel-color", "#f5f5f5");
    document.getElementById("carta-nivel").textContent = "Fin del mazo";
    document.getElementById("carta-tipo").textContent = "";
    document.getElementById("carta-texto").textContent = "¡Jugaron todas las cartas! Pueden volver a mezclar o elegir otro nivel.";
    document.getElementById("carta-timer").classList.add("oculto");
    document.getElementById("btn-subir-nivel").classList.add("oculto");
    carta.classList.add("volteada");
    mazoVolteada = true;

    const btnSiguiente = document.getElementById("btn-siguiente-carta");
    btnSiguiente.textContent = "Volver a mezclar";
    btnSiguiente.disabled = false;

    actualizarContadorMazo();
}

function actualizarContadorMazo() {
    const jugadas = mazoTotal - mazoCartas.length;
    document.getElementById("mazo-contador").textContent = jugadas + " / " + mazoTotal;

    // Cuántas quedan por nivel (solo en mazos de varios niveles)
    const restantes = document.getElementById("mazo-restantes");
    restantes.textContent = "";
    if (mazoNivelesEnJuego.length > 1) {
        mazoNivelesEnJuego.forEach(id => {
            const nivel = buscarNivel(id);
            const chip = document.createElement("span");
            chip.className = "chip-nivel";
            chip.style.setProperty("--nivel-color", nivel.color);
            chip.title = nivel.nombre;
            chip.textContent = nivel.nombre + ": " + mazoCartas.filter(c => c.nivel === id).length;
            restantes.appendChild(chip);
        });
    }

    // Cartas de fondo visibles en la pila (máximo 4)
    const pila = document.getElementById("mazo-pila");
    pila.textContent = "";
    const visibles = Math.min(mazoCartas.length, 4);
    for (let i = 1; i <= visibles; i++) {
        const fondo = document.createElement("div");
        fondo.className = "pila-carta";
        fondo.style.transform = "translate(" + (i * 4) + "px, " + (i * 4) + "px)";
        fondo.style.zIndex = 10 - i;
        pila.appendChild(fondo);
    }
}

// ================= INTERACCIÓN CON LA CARTA =================

function voltearCarta() {
    if (!mazoCartaActual || mazoVolteada) return;

    mazoVolteada = true;
    document.getElementById("carta").classList.add("volteada");
    document.getElementById("btn-siguiente-carta").disabled = false;

    if (mazoCartaActual.tiempo) {
        document.getElementById("btn-timer").textContent = "Iniciar";
        document.getElementById("mazo-controles-timer").classList.remove("oculto");
    }
}

/**
 * Descarta la carta actual con animación y muestra la próxima.
 * También sirve para "pasar" una carta. Al terminar el mazo, lo vuelve a mezclar.
 */
function siguienteCarta() {
    if (mazoAnimando) return;
    if (!mazoCartaActual) {
        iniciarMazo(mazoModo);
        return;
    }

    detenerTimerMazo();
    desactivarAlertaReto();
    bloquearControlesCarta();

    const carta = document.getElementById("carta");
    carta.classList.add("descartada");
    mazoTimeoutAnimacion = setTimeout(prepararSiguienteCarta, 350);
}

/** Evita dobles toques mientras la carta sale de la mesa. */
function bloquearControlesCarta() {
    mazoAnimando = true;
    document.getElementById("btn-siguiente-carta").disabled = true;
    document.getElementById("btn-subir-nivel").classList.add("oculto");
    document.getElementById("mazo-controles-timer").classList.add("oculto");
}

/** Cancela la salida de carta en curso (por ejemplo, si cambian de pantalla en medio de la animación). */
function cancelarAnimacionPendiente() {
    if (mazoTimeoutAnimacion !== null) {
        clearTimeout(mazoTimeoutAnimacion);
        mazoTimeoutAnimacion = null;
    }
    mazoAnimando = false;
}

// ================= SWIPE =================

// Con la carta dada vuelta, arrastrarla hacia un costado pasa a la siguiente.
(function configurarSwipe() {
    const carta = document.getElementById("carta");
    let inicioX = null;
    let desplazamiento = 0;

    carta.addEventListener("pointerdown", (e) => {
        if (!mazoVolteada || !mazoCartaActual || mazoAnimando) return;
        inicioX = e.clientX;
        desplazamiento = 0;
        carta.classList.add("arrastrando");
    });

    carta.addEventListener("pointermove", (e) => {
        if (inicioX === null) return;
        desplazamiento = e.clientX - inicioX;
        carta.style.transform = "translateX(" + desplazamiento + "px) rotate(" + (desplazamiento / 20) + "deg)";
    });

    const soltar = () => {
        if (inicioX === null) return;
        inicioX = null;
        carta.classList.remove("arrastrando");
        carta.style.transform = "";

        if (Math.abs(desplazamiento) >= UMBRAL_SWIPE) {
            siguienteCarta();
        }
    };

    carta.addEventListener("pointerup", soltar);
    carta.addEventListener("pointercancel", soltar);
    carta.addEventListener("pointerleave", soltar);
})();

// ================= TIMER =================

function alternarTimerMazo() {
    if (mazoIntervalo !== null) {
        detenerTimerMazo();
        document.getElementById("btn-timer").textContent = "Continuar";
        return;
    }

    if (mazoTiempoRestante <= 0) {
        reiniciarTimerMazo();
    }

    desactivarAlertaReto();
    document.getElementById("btn-timer").textContent = "Pausar";

    mazoIntervalo = setInterval(() => {
        mazoTiempoRestante--;
        actualizarTimerMazo();

        if (mazoTiempoRestante <= 0) {
            detenerTimerMazo();
            document.getElementById("btn-timer").textContent = "Repetir";
            activarAlertaReto();

            if (navigator.vibrate) {
                navigator.vibrate([300, 150, 300]);
            }

            const audio = document.getElementById("audio-alerta");
            if (audio) {
                audio.currentTime = 0;
                audio.play().catch(() => {}); // el navegador puede bloquear el audio
            }
        }
    }, 1000);
}

function reiniciarTimerMazo() {
    detenerTimerMazo();
    desactivarAlertaReto();
    mazoTiempoRestante = mazoTiempoTotal;
    actualizarTimerMazo();
    document.getElementById("btn-timer").textContent = "Iniciar";
}

function detenerTimerMazo() {
    if (mazoIntervalo !== null) {
        clearInterval(mazoIntervalo);
        mazoIntervalo = null;
    }
}

function actualizarTimerMazo() {
    const restante = Math.max(mazoTiempoRestante, 0);
    const minutos = Math.floor(restante / 60);
    const segundos = String(restante % 60).padStart(2, "0");
    document.getElementById("timer-numero").textContent = minutos + ":" + segundos;

    const progreso = mazoTiempoTotal ? restante / mazoTiempoTotal : 0;
    const anillo = document.getElementById("timer-progreso");
    anillo.style.strokeDashoffset = CIRCUNFERENCIA_TIMER * (1 - progreso);
    anillo.style.opacity = restante > 0 ? 1 : 0; // con borde redondeado, en 0 quedaría un punto visible
}

/**
 * Botón de la palabra de pausa: frena el timer en el acto.
 */
function pausarMazo() {
    if (mazoIntervalo === null) return;
    detenerTimerMazo();
    document.getElementById("btn-timer").textContent = "Continuar";
}

// ================= NAVEGACIÓN =================

function volverMenuMazo() {
    cancelarAnimacionPendiente();
    detenerTimerMazo();
    desactivarAlertaReto();
    mostrarPantalla("menu-mazo");
}

function salirMazo() {
    cancelarAnimacionPendiente();
    detenerTimerMazo();
    volverAlMenu();
}

// Espacio o Enter: da vuelta la carta, o pasa a la siguiente si ya está dada vuelta
document.addEventListener("keydown", (e) => {
    if (!document.getElementById("pantalla-mazo").classList.contains("activa")) return;
    if (e.key !== " " && e.key !== "Enter") return;
    if (e.target.tagName === "BUTTON") return; // deja que el botón con foco maneje la tecla

    e.preventDefault();
    if (!mazoVolteada) {
        voltearCarta();
    } else if (!document.getElementById("btn-siguiente-carta").disabled) {
        siguienteCarta();
    }
});
