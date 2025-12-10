// Este archivo contiene la lógica de la aplicación.
// Los datos (preguntas y retos) se cargan desde datos.js
// Las funciones de alerta (activarAlertaReto, desactivarAlertaReto) se cargan desde efecto.js

let categoriaActual = "";
let nivelActual = 0;
let modoReto = false; // false = preguntas normales, true = estamos en modo retos

// Intervalo del contador de reto
let intervaloReto = null;
let tiempoRestanteReto = 0;

// Control de preguntas usadas por categoría+nivel
let usadas = {};

// ================= FUNCIONES DE CONTROL DE BOTONES =================

/**
 * Habilita o deshabilita los botones de navegación en la pantalla de pregunta/reto.
 * @param {boolean} habilitar - true para habilitar, false para deshabilitar.
 */
function controlarBotonesPregunta(habilitar) {
    const btnOtra = document.getElementById('btn-otra-pregunta');
    const btnVolver = document.getElementById('btn-volver-niveles');
    
    if (btnOtra) {
        btnOtra.disabled = !habilitar;
        // La parte de style.opacity la manejaremos mejor con el CSS
    }
    
    if (btnVolver) {
        btnVolver.disabled = !habilitar;
        // La parte de style.opacity la manejaremos mejor con el CSS
    }
}


// ================= CAMBIO DE PANTALLAS =================

/**
 * Muestra una pantalla y oculta todas las demás.
 * @param {string} id - ID del elemento div de la pantalla a mostrar.
 */
function mostrarPantalla(id) {
    // 1. Oculta todas las pantallas
    document.querySelectorAll(".pantalla").forEach(p => {
        p.classList.remove("activa");
    });
    // 2. Muestra la pantalla deseada
    const pantalla = document.getElementById(id);
    if (pantalla) {
        pantalla.classList.add("activa");
    }
}

// ================= TEMAS (fondos) =================

/**
 * Aplica una clase de tema al <body> basada en la categoría.
 * @param {string} cat - Categoría ('laboral', 'vida', 'parejas', 'default').
 */
function aplicarTema(cat) {
    document.body.classList.remove("tema-default", "tema-laboral", "tema-vida", "tema-parejas");

    switch (cat) {
        case "laboral":
            document.body.classList.add("tema-laboral");
            break;
        case "vida":
            document.body.classList.add("tema-vida");
            break;
        case "parejas":
            document.body.classList.add("tema-parejas");
            break;
        default:
            document.body.classList.add("tema-default");
            break;
    }
}

// ================= LÓGICA PRINCIPAL =================

/**
 * Establece la categoría actual, aplica el tema y muestra el menú de niveles.
 * @param {string} cat - La categoría seleccionada.
 */
function seleccionarCategoria(cat) {
    categoriaActual = cat;
    modoReto = false;
    nivelActual = 0;

    // Control de botones: HABILITADOS por defecto al cambiar de pantalla
    controlarBotonesPregunta(true);

    // Actualiza el título del menú de niveles
    const titulo = document.getElementById("titulo-categoria");
    if (titulo) {
        titulo.textContent = "Categoría: " + cat.toUpperCase();
    }

    aplicarTema(cat);
    
    if (typeof desactivarAlertaReto === 'function') {
        desactivarAlertaReto(); 
    }

    // Muestra/oculta el botón de Retos en Pareja
    const btnRetos = document.getElementById("btn-retos");
    if (btnRetos) { 
        if (cat === "parejas") {
            btnRetos.classList.remove("oculto");
        } else {
            btnRetos.classList.add("oculto");
        }
    }

    // Muestra el menú de niveles
    mostrarPantalla("menu-niveles");
}

/**
 * Inicia el juego con un nivel específico (modo pregunta).
 * @param {number} nivel - El nivel seleccionado (1, 2 o 3).
 */
function seleccionarNivel(nivel) {
    modoReto = false;
    nivelActual = nivel;
    mostrarOtraPregunta();
}

/**
 * Inicia el juego con un nivel aleatorio (modo pregunta).
 */
function nivelAleatorio() {
    modoReto = false;
    nivelActual = Math.floor(Math.random() * 3) + 1;
    mostrarOtraPregunta();
}

/**
 * Muestra una pregunta (o reto) nueva de la categoría y nivel actual.
 */
function mostrarOtraPregunta() {
    detenerReto();
    
    // Control de botones: HABILITADOS (Para preguntas normales)
    controlarBotonesPregunta(true);
    
    if (typeof desactivarAlertaReto === 'function') {
        desactivarAlertaReto(); 
    }

    // Lógica para saltar directamente a otro reto si estamos en modo reto parejas
    if (categoriaActual === "parejas" && modoReto) {
        seleccionarRetoParejas();
        return;
    }

    const tituloPregunta = document.getElementById("titulo-pregunta");
    if (tituloPregunta) {
        tituloPregunta.textContent = "PREGUNTA";
    }

    // Accede al objeto 'preguntas' que se carga desde datos.js
    const lista = preguntas[categoriaActual]?.[nivelActual];
    if (!lista) return;

    const key = categoriaActual + "_" + nivelActual;

    if (!usadas[key]) {
        usadas[key] = new Set();
    }

    // Verifica si ya se usaron todas las preguntas del nivel
    if (usadas[key].size >= lista.length) {
        document.getElementById("pregunta-texto").textContent =
            "Ya respondiste todas las preguntas de este nivel.";
        document.getElementById("contador-tiempo").textContent = "";
        document.getElementById("btn-comenzar-reto").classList.add("oculto"); 
        mostrarPantalla("pantalla-pregunta");
        return;
    }

    let index;
    do {
        index = Math.floor(Math.random() * lista.length);
    } while (usadas[key].has(index));

    usadas[key].add(index);

    document.getElementById("pregunta-texto").textContent = lista[index];
    document.getElementById("contador-tiempo").textContent = "";
    document.getElementById("btn-comenzar-reto").classList.add("oculto"); 
    mostrarPantalla("pantalla-pregunta");
}

// ================= RETOS EN PAREJA =================

/**
 * Selecciona y muestra un reto aleatorio de parejas.
 */
function seleccionarRetoParejas() {
    detenerReto();
    
    // Control de botones: HABILITADOS antes de iniciar el reto
    controlarBotonesPregunta(true);
    
    if (typeof desactivarAlertaReto === 'function') {
        desactivarAlertaReto(); 
    }
    
    modoReto = true; // Activa el modo reto

    const tituloPregunta = document.getElementById("titulo-pregunta");
    if (tituloPregunta) {
        tituloPregunta.textContent = "RETO";
    }

    // Accede al array 'retosParejas' que se carga desde datos.js
    if (retosParejas.length === 0) {
        document.getElementById("pregunta-texto").textContent =
            "No hay retos cargados aún.";
        document.getElementById("contador-tiempo").textContent = "";
        document.getElementById("btn-comenzar-reto").classList.add("oculto");
        mostrarPantalla("pantalla-pregunta");
        return;
    }

    const indice = Math.floor(Math.random() * retosParejas.length);
    const reto = retosParejas[indice];

    // Asigna un tiempo aleatorio para el reto
    const tiempos = [5, 10, 15];
    tiempoRestanteReto = tiempos[Math.floor(Math.random() * tiempos.length)];

    document.getElementById("pregunta-texto").textContent = reto;
    document.getElementById("contador-tiempo").textContent =
        "Tiempo asignado: " + tiempoRestanteReto + " segundos";

    document.getElementById("btn-comenzar-reto").classList.remove("oculto"); // Muestra el botón para iniciar el contador

    mostrarPantalla("pantalla-pregunta");
}

/**
 * Inicia el contador regresivo para el reto.
 */
function iniciarReto() {
    detenerReto();
    
    // Control de botones: DESHABILITADOS al iniciar el conteo
    controlarBotonesPregunta(false); 
    
    if (typeof desactivarAlertaReto === 'function') {
        desactivarAlertaReto(); 
    }

    document.getElementById("btn-comenzar-reto").classList.add("oculto");

    const contadorEl = document.getElementById("contador-tiempo");

    intervaloReto = setInterval(() => {
        tiempoRestanteReto--;

        if (tiempoRestanteReto <= 0) {
            contadorEl.textContent = "Tiempo: 0 segundos - ¡Reto Finalizado!";
            detenerReto();
            
            // Control de botones: HABILITADOS de nuevo al finalizar
            controlarBotonesPregunta(true); 

            // Llama a la función de efectos.js para activar el parpadeo
            if (typeof activarAlertaReto === 'function') {
                activarAlertaReto(); 
            }

            // REPRODUCIR AUDIO
            const audio = document.getElementById('audio-alerta');
            if (audio) {
                audio.currentTime = 0; 
                audio.play();
            }

        } else {
            contadorEl.textContent = "Tiempo: " + tiempoRestanteReto + " segundos";
        }
    }, 1000);
}

/**
 * Detiene el contador del reto.
 */
function detenerReto() {
    if (intervaloReto !== null) {
        clearInterval(intervaloReto);
        intervaloReto = null;
    }
}

// ================= NAVEGACIÓN =================

/**
 * Vuelve al menú principal.
 */
function volverAlMenu() {
    detenerReto();
    
    // Control de botones: HABILITADOS
    controlarBotonesPregunta(true);
    
    if (typeof desactivarAlertaReto === 'function') {
        desactivarAlertaReto(); 
    }
    
    modoReto = false;
    nivelActual = 0;
    aplicarTema("default");
    mostrarPantalla("menu-principal");
}

/**
 * Vuelve al menú de selección de niveles.
 */
function volverNiveles() {
    detenerReto();
    
    // Control de botones: HABILITADOS
    controlarBotonesPregunta(true);
    
    if (typeof desactivarAlertaReto === 'function') {
        desactivarAlertaReto(); 
    }
    
    mostrarPantalla("menu-niveles");
}

// ================= INICIALIZACIÓN =================

// Establece el tema por defecto al cargar la página
aplicarTema("default");

// Se asegura de que los botones estén habilitados al iniciar por si recargamos la pantalla de reto
// Esto previene un estado bloqueado si el navegador guarda el estado
document.addEventListener('DOMContentLoaded', () => {
    controlarBotonesPregunta(true);
});