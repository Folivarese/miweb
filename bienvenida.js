// Pre-pantalla "Reglas del Juego": se muestra solo al abrir la app.
// Hay que tildar todas las reglas: recién ahí se habilita el botón y hace el "brindis".
// "¡Todo listo!" abre el menú principal (mostrarPantalla de codigo.js). No toca la lógica del mazo.

(function () {
    const reglas = document.querySelectorAll("#bienvenida .regla");
    const btnListo = document.getElementById("btn-todo-listo");
    const ayuda = document.querySelector("#bienvenida .reglas-ayuda");

    reglas.forEach(regla => {
        regla.addEventListener("click", () => {
            const tildada = regla.getAttribute("aria-pressed") !== "true";
            regla.setAttribute("aria-pressed", String(tildada));

            const tildadas = [...reglas].filter(r => r.getAttribute("aria-pressed") === "true").length;
            const todas = tildadas === reglas.length;
            btnListo.classList.toggle("brindando", todas);
            btnListo.disabled = !todas;
            ayuda.textContent = todas ? "¡Todo en orden! A brindar." : tildadas + " de " + reglas.length + " reglas tildadas";
        });
    });

    btnListo.addEventListener("click", () => {
        if (btnListo.disabled) return;
        mostrarPantalla("menu-principal");
        window.scrollTo(0, 0);
    });
})();
