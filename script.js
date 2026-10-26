// Endpoint de Railway (proxy en producción):
const PROXY_URL = 'https://automatizaciondataexcel-production.up.railway.app';

// Endpoint local del proxy (para probar en tu máquina, rama Proxy):
// const PROXY_URL = 'http://localhost:3000';

const form = document.getElementById('exportForm');
const input = document.getElementById('reportInput');
const submitBtn = document.getElementById('submitBtn');
const results = document.getElementById('results');

form.addEventListener('submit', (event) => {
    event.preventDefault();
    const report = input.value.trim();
    if (report) {
        generarExcel(report);
    }
});

// Último reporte generado, para volver a filtrarlo sin consultar de nuevo al servidor
let ultimoReporte = null;

async function generarExcel(report) {
    const desde = document.getElementById('fechaDesde').value;
    const hasta = document.getElementById('fechaHasta').value;
    if (desde && hasta && desde > hasta) {
        renderError('La fecha "Desde" no puede ser posterior a la fecha "Hasta".');
        return;
    }
    setLoading(true);
    renderLoading(report);

    try {
        const response = await fetch(`${PROXY_URL}/api/export/${encodeURIComponent(report)}`);
        const data = await response.json();

        if (!response.ok) {
            renderError(data.error || 'No se pudo generar el archivo.');
            return;
        }

        // El archivo se lee en el navegador para filtrarlo por fechas y nombrarlo; si no se puede,
        // queda el enlace original del servidor.
        try {
            const archivo = await fetch(data.file);
            if (!archivo.ok) throw new Error(`HTTP ${archivo.status}`);
            const libro = XLSX.read(await archivo.arrayBuffer(), { type: 'array' });
            ultimoReporte = { report, data, libro, columnasFecha: detectarColumnasFecha(libro) };
            descargarFiltrado(ultimoReporte.columnasFecha[0] || '');
        } catch (error) {
            console.error('No se pudo procesar el archivo en el navegador:', error);
            renderSuccess(data, 'No se pudo aplicar el filtro de fechas en el navegador; se ofrece el archivo completo.');
        }
    } catch (error) {
        console.error('Error al generar el excel:', error);
        renderError('No se pudo conectar con el servidor. Verifica que el proxy esté activo.');
    } finally {
        setLoading(false);
    }
}

/* ---------- Filtro de fechas y nombre del archivo ---------- */

const pad2 = (n) => String(n).padStart(2, '0');

/** Convierte un valor de celda a 'AAAA-MM-DD' (texto ISO, dd/mm/aaaa o número de serie de Excel). */
function fechaISO(valor, permitirNumero) {
    if (valor === null || valor === undefined || valor === '') return null;
    if (typeof valor === 'number') {
        if (!permitirNumero || valor < 20000 || valor > 80000) return null;
        const d = XLSX.SSF.parse_date_code(valor);
        return `${d.y}-${pad2(d.m)}-${pad2(d.d)}`;
    }
    const texto = String(valor).trim();
    let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(texto);
    if (m) return `${m[1]}-${pad2(m[2])}-${pad2(m[3])}`;
    m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/.exec(texto);
    return m ? `${m[3]}-${pad2(m[2])}-${pad2(m[1])}` : null;
}

const pareceFecha = (nombre) => /fech|fecha|date|dia|created|modified|creado/i.test(nombre);

/** Columnas cuyo contenido son fechas, ordenadas por preferencia (FECHA_VISITA, FECHA..., luego creación). */
function detectarColumnasFecha(libro) {
    const hoja = libro.Sheets[libro.SheetNames[0]];
    const filas = XLSX.utils.sheet_to_json(hoja, { defval: '', raw: true });
    if (!filas.length) return [];
    const muestra = filas.slice(0, 300);
    const columnas = Object.keys(filas[0]).filter((col) => {
        const valores = muestra.map((f) => f[col]).filter((v) => v !== '');
        if (!valores.length) return false;
        const fechas = valores.filter((v) => fechaISO(v, pareceFecha(col))).length;
        return fechas / valores.length >= 0.8;
    });
    const prioridad = (col) => {
        const k = col.toLowerCase().replace(/[^a-z]/g, '');
        if (k === 'fechavisita' || k === 'fechadevisita') return 0;
        if (k.startsWith('fecha') || k === 'fech') return 1;
        if (/created|creado|modified/.test(k)) return 3;
        return 2;
    };
    return columnas.sort((a, b) => prioridad(a) - prioridad(b));
}

/** Filtra el último reporte por la columna de fecha elegida, lo descarga y muestra el resumen. */
function descargarFiltrado(columna) {
    const { report, data, libro, columnasFecha } = ultimoReporte;
    const desde = document.getElementById('fechaDesde').value;
    const hasta = document.getElementById('fechaHasta').value;
    const hoja = libro.Sheets[libro.SheetNames[0]];
    const rango = XLSX.utils.decode_range(hoja['!ref']);

    let colIdx = -1;
    for (let c = rango.s.c; c <= rango.e.c; c++) {
        const celda = hoja[XLSX.utils.encode_cell({ r: rango.s.r, c })];
        if (celda && String(celda.v) === columna) colIdx = c;
    }

    // Copia celda por celda las filas dentro del rango (tipos y formatos intactos)
    const nueva = {};
    let destino = 0, total = 0, incluidas = 0, sinFecha = 0, primera = null;
    for (let r = rango.s.r; r <= rango.e.r; r++) {
        let incluir = true;
        if (r > rango.s.r) {
            total++;
            const celda = colIdx >= 0 ? hoja[XLSX.utils.encode_cell({ r, c: colIdx })] : null;
            const fecha = celda ? fechaISO(celda.v, pareceFecha(columna)) : null;
            if ((desde || hasta) && colIdx >= 0) {
                if (!fecha) { incluir = false; sinFecha++; }
                else if ((desde && fecha < desde) || (hasta && fecha > hasta)) incluir = false;
            }
            if (incluir) {
                incluidas++;
                if (fecha && (!primera || fecha < primera)) primera = fecha;
            }
        }
        if (!incluir) continue;
        for (let c = rango.s.c; c <= rango.e.c; c++) {
            const celda = hoja[XLSX.utils.encode_cell({ r, c })];
            if (celda) nueva[XLSX.utils.encode_cell({ r: destino, c })] = { ...celda };
        }
        destino++;
    }
    nueva['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: rango.s.c }, e: { r: Math.max(destino - 1, 0), c: rango.e.c } });
    if (hoja['!cols']) nueva['!cols'] = hoja['!cols'];

    // Nombre: reporte + fecha de inicio (la elegida o, si no hay, la primera fecha de los datos)
    const hoy = new Date();
    const inicio = desde || primera || `${hoy.getFullYear()}-${pad2(hoy.getMonth() + 1)}-${pad2(hoy.getDate())}`;
    const nombre = `${report.replace(/[\\/:*?"<>|\s]+/g, '_')}_${inicio}.xlsx`;
    const salida = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(salida, nueva, libro.SheetNames[0].slice(0, 31));
    const filtrar = Boolean(desde || hasta);

    if (filtrar && colIdx < 0) {
        renderSuccess(data, 'El reporte no tiene una columna de fecha reconocible; se ofrece el archivo completo.');
        return;
    }
    if (incluidas === 0) {
        renderFiltrado({ report, nombre, total, incluidas, sinFecha, columna, columnasFecha, desde, hasta, data, vacio: true });
        return;
    }
    XLSX.writeFile(salida, nombre);
    ultimoReporte.salida = { libro: salida, nombre };
    renderFiltrado({ report, nombre, total, incluidas, sinFecha, columna, columnasFecha, desde, hasta, data, filtrar });
}

function renderFiltrado(r) {
    const fmt = (f) => (f ? f.split('-').reverse().join('/') : '');
    const rangoTxt = r.desde || r.hasta
        ? `${r.desde ? 'desde el ' + fmt(r.desde) : ''}${r.desde && r.hasta ? ' ' : ''}${r.hasta ? 'hasta el ' + fmt(r.hasta) : ''}`
        : 'sin filtro de fechas';
    const selector = r.columnasFecha.length > 1
        ? `<label>Filtrar por <select id="columnaFecha">${r.columnasFecha
            .map((c) => `<option${c === r.columna ? ' selected' : ''}>${escapeHtml(c)}</option>`).join('')}</select></label>`
        : '';
    results.innerHTML = r.vacio ? `
        <div class="state-card error">
            <i class="material-icons">event_busy</i>
            <div class="body">
                <div class="title">Ninguna fila en el rango (${rangoTxt})</div>
                <div>Reporte: ${escapeHtml(r.report)} · ${r.total.toLocaleString('es-CO')} filas revisadas por la columna ${escapeHtml(r.columna)}.</div>
                <div class="acciones">${selector}</div>
            </div>
        </div>` : `
        <div class="state-card success">
            <i class="material-icons">check_circle</i>
            <div class="body">
                <div class="title">Archivo descargado: ${escapeHtml(r.nombre)}</div>
                <div>${r.incluidas.toLocaleString('es-CO')} de ${r.total.toLocaleString('es-CO')} filas · ${rangoTxt}${r.filtrar ? ` · columna ${escapeHtml(r.columna)}` : ''}</div>
                ${r.sinFecha ? `<div class="detalle">${r.sinFecha.toLocaleString('es-CO')} filas sin fecha quedaron fuera.</div>` : ''}
                <div class="acciones">
                    <button type="button" class="download-link" id="redescargar">
                        <i class="material-icons">file_download</i>
                        Descargar de nuevo
                    </button>
                    ${selector}
                </div>
            </div>
        </div>`;
    document.getElementById('redescargar')?.addEventListener('click', () => {
        XLSX.writeFile(ultimoReporte.salida.libro, ultimoReporte.salida.nombre);
    });
    document.getElementById('columnaFecha')?.addEventListener('change', (e) => descargarFiltrado(e.target.value));
}

function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    input.disabled = isLoading;
}

function renderLoading(report) {
    results.innerHTML = `
        <div class="state-card loading">
            <div class="spinner"></div>
            <div class="body">
                <div class="title">Generando "${escapeHtml(report)}"...</div>
                <div>Esto puede tardar unos segundos.</div>
            </div>
        </div>
    `;
}

function renderSuccess(data, aviso) {
    results.innerHTML = `
        <div class="state-card success">
            <i class="material-icons">check_circle</i>
            <div class="body">
                <div class="title">Archivo listo (${data.rows} filas)</div>
                <div>Reporte: ${escapeHtml(data.report)}</div>
                ${aviso ? `<div class="detalle">${escapeHtml(aviso)}</div>` : ''}
                <a class="download-link" href="${data.file}" target="_blank" rel="noopener noreferrer">
                    <i class="material-icons">file_download</i>
                    Descargar Excel
                </a>
            </div>
        </div>
    `;
}

function renderError(message) {
    results.innerHTML = `
        <div class="state-card error">
            <i class="material-icons">error_outline</i>
            <div class="body">
                <div class="title">No se pudo generar el archivo</div>
                <div>${escapeHtml(message)}</div>
            </div>
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function toggleDarkMode() {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.body.classList.toggle('dark-mode', isDark);
    document.getElementById('darkModeLabel').textContent = isDark ? '☀️ Modo claro' : '🌙 Modo oscuro';
    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
}

window.onload = () => {
    const darkModeSetting = localStorage.getItem('darkMode');
    const isDark = darkModeSetting === 'enabled';
    document.body.classList.toggle('dark-mode', isDark);
    document.getElementById('darkModeToggle').checked = isDark;
    document.getElementById('darkModeLabel').textContent = isDark ? '☀️ Modo claro' : '🌙 Modo oscuro';
};
