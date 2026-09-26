// Pre-pantalla "Reglas del Juego": se muestra solo al abrir la app.
// Hay que tildar todas las reglas: recién ahí se habilita el botón y hace el "brindis".
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
            btnListo.disabled = !todas;
        });
    });

    btnListo.addEventListener("click", () => {
        if (btnListo.disabled) return;
        mostrarPantalla("menu-principal");
        window.scrollTo(0, 0);
    });
})();
