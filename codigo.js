// Este archivo contiene la navegación general de la aplicación.
// Las preguntas se cargan desde datos.js y las cartas del Mazo del Deseo desde cards.json.
// La lógica del mazo (todas las categorías) está en mazo.js.
// Las funciones de alerta (activarAlertaReto, desactivarAlertaReto) se cargan desde efecto.js

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
 * @param {string} cat - Categoría ('laboral', 'vida', 'parejas', 'deseo', 'default').
 */
function aplicarTema(cat) {
    document.body.classList.remove("tema-default", "tema-laboral", "tema-vida", "tema-parejas", "tema-deseo");

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
        case "deseo":
            document.body.classList.add("tema-deseo");
            break;
        default:
            document.body.classList.add("tema-default");
            break;
    }
}

// ================= NAVEGACIÓN =================

/**
 * Vuelve al menú principal.
 */
function volverAlMenu() {
    desactivarAlertaReto();
    aplicarTema("default");
    mostrarPantalla("menu-principal");
}

// ================= INICIALIZACIÓN =================

// Establece el tema por defecto al cargar la página
aplicarTema("default");
