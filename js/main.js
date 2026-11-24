class ComponenteGTI {
    constructor(id, nombre, categoria, precio, stock = 1) {
        this.id = id;
        this.nombre = nombre;
        this.categoria = categoria;
        this.precio = precio;
        this.stock = stock;
    }
}

const CLAVE_STORAGE = "inventarioGTI_storage";
let inventarioGTI = [];

const contenedorInventario = document.getElementById("contenedorInventario");
const formComponente = document.getElementById("formComponente");
const inputBusqueda = document.getElementById("inputBusqueda");
const feedbackMensaje = document.getElementById("feedbackMensaje");
const estadoCarga = document.getElementById("estadoCarga");

function notificarUsuario(titulo, texto, icono) {
    Swal.fire({
        title: titulo,
        text: texto,
        icon: icono,
        background: "#1e1e1e",
        color: "#ffffff",
        confirmButtonColor: "#d32f2f",
        timer: 2500,
        showConfirmButton: false
    });
}

function mostrarFeedback(mensaje) {
    feedbackMensaje.textContent = mensaje;
    feedbackMensaje.className = "feedback-activo";

    setTimeout(() => {
        feedbackMensaje.className = "feedback-oculto";
    }, 3000);
}

function guardarEnStorage() {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(inventarioGTI));
}

function renderizarInventario(lista) {
    contenedorInventario.innerHTML = "";

    if (lista.length === 0) {
        const textoVacio = inputBusqueda?.value.trim()
            ? "No se encontraron componentes que coincidan con la busqueda."
            : "No hay componentes cargados en el inventario.";
        contenedorInventario.innerHTML = `<p style="color: #888;">${textoVacio}</p>`;
        return;
    }

    lista.forEach(componente => {
        const { id, nombre, categoria, precio, stock } = componente;

        const tarjeta = document.createElement("div");
        tarjeta.className = "card-componente";

        tarjeta.innerHTML = `
            <div>
                <h3>${nombre}</h3>
                <p>Categoria: <strong>${categoria}</strong></p>
                <p class="precio">$${precio.toLocaleString()} <span style="color: #aaa; font-size: 0.85rem;">(stock: ${stock})</span></p>
            </div>
            <button class="btn-eliminar" data-id="${id}">Eliminar</button>
        `;

        contenedorInventario.appendChild(tarjeta);
    });

    activarBotonesEliminar();
}

async function cargarComponentesIniciales() {
    estadoCarga.style.display = "block";
    estadoCarga.textContent = "Cargando componentes...";

    try {
        const respuesta = await fetch("./data.json");

        if (!respuesta.ok) {
            throw new Error("No se pudo obtener la informacion de componentes.");
        }

        const datosJSON = await respuesta.json();
        const datosGuardados = JSON.parse(localStorage.getItem(CLAVE_STORAGE));

        const baseDatos = datosGuardados ?? datosJSON;
        inventarioGTI = baseDatos.map(
            ({ id, nombre, categoria, precio, stock }) =>
                new ComponenteGTI(id, nombre, categoria, precio, stock ?? 1)
        );

        guardarEnStorage();
        renderizarInventario(inventarioGTI);
        notificarUsuario("Componentes cargados", "El inventario del GTI se cargo con exito.", "success");
    } catch (error) {
        renderizarInventario([]);
        notificarUsuario(
            "Error al cargar datos",
            error?.message ?? "Ocurrio un error inesperado al consultar los componentes.",
            "error"
        );
    } finally {
        estadoCarga.style.display = "none";
    }
}

formComponente.addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const categoria = document.getElementById("categoria").value.trim();
    const precio = Number(document.getElementById("precio").value);
    const stock = Number(document.getElementById("stock").value);

    const ultimoId = inventarioGTI.at(-1)?.id ?? 0;
    const nuevoId = inventarioGTI.length > 0 ? ultimoId + 1 : 1;

    const nuevoComponente = new ComponenteGTI(nuevoId, nombre, categoria, precio, stock);

    inventarioGTI.push(nuevoComponente);
    guardarEnStorage();
    renderizarInventario(inventarioGTI);

    const { nombre: nombreAgregado } = nuevoComponente;
    mostrarFeedback(`Componente "${nombreAgregado}" agregado con exito.`);
    notificarUsuario("Componente agregado", `"${nombreAgregado}" se sumo al inventario.`, "success");
    formComponente.reset();
});

function activarBotonesEliminar() {
    const botonesEliminar = document.querySelectorAll(".btn-eliminar");

    botonesEliminar.forEach(boton => {
        boton.addEventListener("click", (e) => {
            const idBuscado = Number(e.target.getAttribute("data-id"));
            const indice = inventarioGTI.findIndex(item => item.id === idBuscado);

            if (indice !== -1) {
                const { nombre: nombreEliminado } = inventarioGTI[indice];
                inventarioGTI.splice(indice, 1);

                guardarEnStorage();
                renderizarInventario(inventarioGTI);
                mostrarFeedback(`Se elimino "${nombreEliminado}" del inventario.`);
                notificarUsuario("Componente eliminado", `"${nombreEliminado}" fue quitado de la lista.`, "info");
            }
        });
    });
}

inputBusqueda.addEventListener("keyup", (e) => {
    const textoBusqueda = e.target.value.toLowerCase();

    const resultadoFiltrado = inventarioGTI.filter(({ nombre, categoria }) =>
        nombre.toLowerCase().includes(textoBusqueda) ||
        categoria.toLowerCase().includes(textoBusqueda)
    );

    renderizarInventario(resultadoFiltrado);
});

cargarComponentesIniciales();