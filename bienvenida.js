// Pre-pantalla "Reglas del Juego": se muestra solo al abrir la app.
// Tildar las reglas es opcional; si se tildan todas, el botón hace el "brindis".
// "¡Todo listo!" abre el menú principal (mostrarPantalla de codigo.js). No toca la lógica del mazo.

(function () {
    const reglas = document.querySelectorAll("#bienvenida .regla");
    const btnListo = document.getElementById("btn-todo-listo");

    reglas.forEach(regla => {
        regla.addEventListener("click", () => {
            const tildada = regla.getAttribute("aria-pressed") !== "true";
            regla.setAttribute("aria-pressed", String(tildada));

            const todas = [...reglas].every(r => r.getAttribute("aria-pressed") === "true");
            btnListo.classList.toggle("brindando", todas);
        });
    });

    btnListo.addEventListener("click", () => {
        mostrarPantalla("menu-principal");
        window.scrollTo(0, 0);
    });
})();
