"use strict";
/* ============================== Texto ============================== */
const sinAcentos = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "");
const clave = s => sinAcentos(s).toLowerCase().replace(/[^a-z0-9]/g, "");
const tokens = s => sinAcentos(s).toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
const vacio = v => v === null || v === undefined || String(v).trim() === "";
const titulo = s => String(s).toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());
const contieneSeq = (toks, seq) => toks.some((_, i) => seq.every((t, j) => toks[i + j] === t));
const fmt = (lat, lon) => `${lat.toFixed(6)}, ${lon.toFixed(6)}`;

/* ============================== Catálogos ============================== */
const DEPARTAMENTOS = {IBAGUE:"Tolima",PEREIRA:"Risaralda",DOSQUEBRADAS:"Risaralda","LA VIRGINIA":"Risaralda",
  BARRANQUILLA:"Atlántico",SOLEDAD:"Atlántico","PUERTO COLOMBIA":"Atlántico",MALAMBO:"Atlántico",BOGOTA:"Bogotá",
  SOACHA:"Cundinamarca",FACATATIVA:"Cundinamarca",ZIPAQUIRA:"Cundinamarca",CHIA:"Cundinamarca",TUNJA:"Boyacá",
  MEDELLIN:"Antioquia",BELLO:"Antioquia",ENVIGADO:"Antioquia",SABANETA:"Antioquia",ITAGUI:"Antioquia",
  "LA ESTRELLA":"Antioquia",RIONEGRO:"Antioquia",CALI:"Valle del Cauca",YUMBO:"Valle del Cauca",JAMUNDI:"Valle del Cauca",
  PALMIRA:"Valle del Cauca",BUCARAMANGA:"Santander",FLORIDABLANCA:"Santander",GIRON:"Santander",PIEDECUESTA:"Santander",
  MANIZALES:"Caldas",VILLAMARIA:"Caldas",CARTAGENA:"Bolívar","SANTA MARTA":"Magdalena",CUCUTA:"Norte de Santander",
  VILLAVICENCIO:"Meta",ARMENIA:"Quindío",NEIVA:"Huila",PASTO:"Nariño",MONTERIA:"Córdoba",VALLEDUPAR:"Cesar",POPAYAN:"Cauca",
  "SAN JOSE DEL GUAVIARE":"Guaviare",CALDAS:"Antioquia",ESPINAL:"Tolima",CAJICA:"Cundinamarca",COTA:"Cundinamarca",
  "LOS PATIOS":"Norte de Santander","VILLA DEL ROSARIO":"Norte de Santander"};
const AREA_METROPOLITANA = {PEREIRA:["DOSQUEBRADAS","LA VIRGINIA"],DOSQUEBRADAS:["PEREIRA"],
  MEDELLIN:["BELLO","ENVIGADO","ITAGUI","SABANETA"],BELLO:["MEDELLIN"],ENVIGADO:["MEDELLIN","SABANETA","ITAGUI"],
  SABANETA:["ENVIGADO","MEDELLIN","LA ESTRELLA"],BARRANQUILLA:["SOLEDAD","PUERTO COLOMBIA","MALAMBO"],
  BUCARAMANGA:["FLORIDABLANCA","GIRON","PIEDECUESTA"],FLORIDABLANCA:["BUCARAMANGA","PIEDECUESTA","GIRON"],
  CALI:["YUMBO","JAMUNDI"],BOGOTA:["SOACHA","CHIA","CAJICA","COTA"],MANIZALES:["VILLAMARIA"],
  CUCUTA:["LOS PATIOS","VILLA DEL ROSARIO"]};
const ALIAS_MUNICIPIO = [[["FLORIDA","B"],"FLORIDABLANCA"]];
// [código, nombre para buscar, alias (secuencias de tokens), ciudades sede de la cadena]
const MARCAS = [
  ["EXITO","Éxito",[["EXITO"]],[]], ["OLIMPICA","Olímpica",[["OLIMPICA"],["SAO"]],[]],
  ["MAKRO","Makro",[["MAKRO"]],[]], ["EURO","Euro Supermercados",[["EURO"]],[]],
  ["MERCALDAS","Mercaldas",[["MERCALDAS"]],["MANIZALES"]], ["SUPERMU","Supermú",[["SUPERMU"],["SUPER","MU"]],[]],
  ["SUPERINTER","Super Inter",[["SUPERINTER"],["SUPER","INTER"]],[]],
  ["LAMONTANA","La Montaña Agromercados",[["LA","MONTANA"],["AGROMERCADOS"],["LA","14"]],[]],
  ["MASXMENOS","Mas x Menos",[["MAS","POR","MENOS"],["MAS","X","MENOS"],["MASXMENOS"]],[]],
  ["METROPOL","Metropol",[["METROPOL"]],[]], ["MEGATIENDAS","Megatiendas",[["MEGATIENDA"],["MEGATIENDAS"]],[]],
  ["ZAPATOCA","Mercados Zapatoca",[["ZAPATOCA"]],[]], ["MERCACENTRO","Mercacentro",[["MERCACENTRO"]],[]],
  ["SURTIPLAZA","Surtiplaza",[["SURTIPLAZA"]],[]], ["VAQUITA","La Vaquita",[["VAQUITA"]],[]],
  ["CARULLA","Carulla",[["CARULLA"]],[]], ["JUMBO","Jumbo",[["JUMBO"]],[]], ["D1","Tiendas D1",[["D1"]],[]],
  ["ARA","Tiendas Ara",[["ARA"]],[]], ["ALKOSTO","Alkosto",[["ALKOSTO"]],[]], ["COLSUBSIDIO","Colsubsidio",[["COLSUBSIDIO"]],[]],
  ["CONSUMO","Consumo",[["CONSUMO"]],[]], ["CAFAM","Cafam",[["CAFAM"]],[]], ["SURTIMAX","Surtimax",[["SURTIMAX"]],[]],
  ["METROMAX","Metromax",[["METROMAX"]],[]],
  // Droguerías: aquí «Droguería» o «Farmacia» en el nombre sí es la tienda buscada
  ["FARMATODO","Farmatodo",[["FARMATODO"]],[]], ["LOCATEL","Locatel",[["LOCATEL"]],[]],
  ["CRUZVERDE","Cruz Verde",[["CRUZ","VERDE"]],[]], ["PASTEUR","Pasteur",[["PASTEUR"]],[]],
];
const GENERICAS = new Set(["SUPERMERCADO","SUPERMERCADOS","AUTOSERVICIO","AUTOSERVICIOS","MERCADOS","MERCADO",
  "SUPERTIENDAS","SUPERTIENDA","SAS","S","A","SA","DE","LA","EL","LOS","LAS","DEL","Y","N","NO"]);
const SEDE_GENERICA = new Set(["CENTRO","NORTE","SUR","PLAZA","PARQUE","CALLE","CARRERA","AVENIDA","EXPRESS"]);
const ABREV = {CL:"CALLE",CLL:"CALLE",CR:"CARRERA",CRA:"CARRERA",KR:"CARRERA",PZ:"PLAZA",CC:"CENTRO COMERCIAL",AV:"AVENIDA"};
const AJENOS = new Set(["OPTICA","OPTICAS","DROGUERIA","DROGUERIAS","FARMACIA","CAJERO","ATM","PARQUEADERO","ESTACION",
  "BANCO","VIAJES","SEGUROS","GASOLINERA","SERVITECA","CLUB","VINO","VINOS","LICORES","LICORERA","AKT","MOTOS","BALOTO","PAC","EDS"]);
const TIPOS_TIENDA = new Set(["supermarket","grocery_store","store","food_store","department_store","hypermarket",
  "wholesaler","discount_store","convenience_store","shopping_mall","market","warehouse_store","butcher_shop"]);
const FARMACIAS = new Set(["FARMATODO", "LOCATEL", "CRUZVERDE", "PASTEUR", "COLSUBSIDIO", "CAFAM"]);
const AJENOS_FARMACIA = new Set([...AJENOS].filter(t => !/DROGUERIA|FARMACIA/.test(t)));
const expandir = toks => toks.flatMap(t => (ABREV[t] || t).split(" "));
const nombreMunicipio = c => ({BOGOTA:"Bogotá",MEDELLIN:"Medellín",IBAGUE:"Ibagué",FACATATIVA:"Facatativá",
  ZIPAQUIRA:"Zipaquirá",ITAGUI:"Itagüí",GIRON:"Girón",JAMUNDI:"Jamundí",VILLAMARIA:"Villamaría",CHIA:"Chía",
  CUCUTA:"Cúcuta",POPAYAN:"Popayán",MONTERIA:"Montería","SAN JOSE DEL GUAVIARE":"San José del Guaviare",
  CAJICA:"Cajicá"}[c] || titulo(c));
const codigoMunicipio = s => { const k = clave(s).toUpperCase();
  return Object.keys(DEPARTAMENTOS).find(m => clave(m).toUpperCase() === k) || sinAcentos(s).trim().toUpperCase(); };

/* ============================== Coordenadas originales ============================== */
const esSinGeo = (lat, lon) => /sin\s*geo/i.test(`${lat ?? ""} ${lon ?? ""}`);
const enColombia = (lat, lon) => lat >= -4.3 && lat <= 13.6 && lon >= -82 && lon <= -66.8;
function diagnostico(lat, lon) {
  if (esSinGeo(lat, lon)) return "Marcado 'sin geo'";
  if (vacio(lat) || vacio(lon)) return "Coordenadas vacías";
  const a = parseFloat(String(lat).replace(",", ".")), b = parseFloat(String(lon).replace(",", "."));
  if (isNaN(a) || isNaN(b)) return `Coordenadas no numéricas (${lat}, ${lon})`;
  if (Number.isInteger(a) && Number.isInteger(b)) return `Valor marcador ${lat}/${lon} pendiente de verificación` + (enColombia(a, b) ? "" : " (fuera de Colombia)");
  if (!enColombia(a, b)) return `Coordenadas originales fuera de Colombia (${a}, ${b})`;
  return "Coordenadas originales numéricas (no verificadas)";
}

/* ============================== Direcciones colombianas ============================== */
const TIPOS_VIA = {CL:"Calle",CLL:"Calle",CALLE:"Calle",AC:"Avenida Calle",CR:"Carrera",CRA:"Carrera",KR:"Carrera",
  KRA:"Carrera",CARRERA:"Carrera",AK:"Avenida Carrera",DG:"Diagonal",DIAGONAL:"Diagonal",TV:"Transversal",
  TR:"Transversal",TRANSVERSAL:"Transversal",AV:"Avenida",AVENIDA:"Avenida"};
const CRUCE_POR_TIPO = {"Calle":["Carrera","Transversal"],"Avenida Calle":["Carrera","Transversal"],"Diagonal":["Carrera","Transversal"],
  "Carrera":["Calle","Diagonal"],"Avenida Carrera":["Calle","Diagonal"],"Transversal":["Calle","Diagonal"],"Avenida":["Calle","Carrera"]};
const SENTIDOS = {SUR:"Sur",NORTE:"Norte",ESTE:"Este",OESTE:"Oeste"};
const direccionAusente = d => vacio(d) || ["sindireccion","sindir","sd","na","nodisponible","notiene","0"].includes(clave(d));

function leerNumero(toks, i) {
  if (i >= toks.length) return [null, i];
  const m = /^(\d+)([A-Z]{0,4})$/.exec(toks[i]);
  if (!m) return [null, i];
  let numero = m[1], suf = m[2], letra = "", bis = false, sentido = "";
  i++;
  if (suf.endsWith("BIS")) { letra = suf.slice(0, -3); bis = true; }
  else if (suf.length === 2 && "NS".includes(suf[1])) { letra = suf[0]; sentido = suf[1] === "N" ? "Norte" : "Sur"; }
  else letra = suf;
  while (i < toks.length) {
    const t = toks[i];
    if (!letra && /^[A-H]$/.test(t)) letra = t;
    else if (t === "BIS") bis = true;
    else if (SENTIDOS[t]) sentido = SENTIDOS[t];
    else break;
    i++;
  }
  return [numero + letra + (bis ? " Bis" : "") + (sentido ? " " + sentido : ""), i];
}

function parsearDireccion(dir) {
  const d = {original: vacio(dir) ? "" : String(dir), ausente: false, tipo: null, nombreVia: null, numero: null,
    cruceTipo: null, cruce: null, placa: null, esquina: false, complemento: "", problemas: []};
  if (direccionAusente(dir)) { d.ausente = true; d.problemas.push("Dirección ausente"); return d; }
  let texto = sinAcentos(d.original).toUpperCase()
    .replace(/N[°º]|\bNO\.?(?=\s|\d)|\bNRO\.?|#|-|–|—|\.|,/g, " ");
  const toks = texto.split(/\s+/).filter(Boolean);
  if (!toks.length || !TIPOS_VIA[toks[0]]) { d.problemas.push("Tipo de vía no reconocido"); return d; }
  d.tipo = TIPOS_VIA[toks[0]];
  let i = 1;
  if (d.tipo === "Avenida" && ["CL","CALLE","CR","CRA","CARRERA","KR"].includes(toks[i])) { d.tipo = "Avenida " + TIPOS_VIA[toks[i]]; i++; }
  if (d.tipo === "Avenida" && i < toks.length && !/^\d/.test(toks[i])) {
    const pal = [];
    while (i < toks.length && !/^\d/.test(toks[i])) pal.push(toks[i++]);
    d.nombreVia = titulo(pal.join(" "));
    [d.cruce, i] = leerNumero(toks, i);
  } else {
    [d.numero, i] = leerNumero(toks, i);
    if (i < toks.length && TIPOS_VIA[toks[i]]) { d.cruceTipo = TIPOS_VIA[toks[i]]; i++; }
    [d.cruce, i] = leerNumero(toks, i);
  }
  if (i < toks.length && /^\d+[A-Z]?$/.test(toks[i])) d.placa = toks[i++];
  let resto = toks.slice(i);
  // «Calle 83 # 4-72 Sur»: el sentido escrito al final pertenece a la vía principal
  const sentidoFinal = resto.find(t => SENTIDOS[t]);
  if (sentidoFinal && d.numero && !/ (Sur|Norte|Este|Oeste)$/.test(d.numero)) {
    d.numero += " " + SENTIDOS[sentidoFinal];
    resto = resto.filter(t => t !== sentidoFinal);
  }
  if (resto.some(t => t === "ESQ" || t === "ESQUINA")) { d.esquina = true; resto = resto.filter(t => t !== "ESQ" && t !== "ESQUINA"); }
  d.complemento = resto.join(" ");
  if (d.cruceTipo && !d.placa) d.esquina = true;
  if (!d.numero && !d.nombreVia) d.problemas.push("Sin número de vía principal");
  if (d.numero && /^\d{4,}/.test(d.numero)) d.problemas.push(`Número de vía '${d.numero}' inusual: posible error de digitación`);
  if (!d.cruce) d.problemas.push("Sin número de cruce");
  else if (!d.placa && !d.esquina) d.problemas.push("Sin número de placa");
  return d;
}
const viaPrincipal = d => !d.tipo ? null : d.nombreVia ? `${d.tipo} ${d.nombreVia}` : d.numero ? `${d.tipo} ${d.numero}` : null;
const tiposCruce = d => d.cruceTipo ? [d.cruceTipo] : (CRUCE_POR_TIPO[d.tipo] || ["Calle","Carrera"]);
const utilizable = d => !!(viaPrincipal(d) && (d.cruce || d.esquina) && !d.ausente && !d.problemas.some(p => p.includes("posible error")));
function normalizada(d) {
  if (d.ausente) return "";
  const v = viaPrincipal(d);
  if (!v) return d.original.trim();
  if (d.esquina) return `${v} con ${tiposCruce(d)[0]} ${d.cruce}`;
  if (d.cruce && d.placa) return `${v} # ${d.cruce}-${d.placa}`;
  return d.cruce ? `${v} # ${d.cruce}` : v;
}
/** Convierte la primera parte de una dirección de Google ("Cra. 22 #17-11") al formato de la base. */
function parsearDireccionGoogle(texto) {
  const primera = String(texto || "").split(",")[0]
    .replace(/\bCra\.?|\bKr\.?|\bCarrera\.?/gi, "CR").replace(/\bCl\.?|\bCll\.?|\bCalle\.?/gi, "CL")
    .replace(/\bAk\.?/gi, "AK").replace(/\bAc\.?/gi, "AC").replace(/\bDg\.?/gi, "DG")
    .replace(/\bTv\.?|\bTr\.?/gi, "TV").replace(/\bAv\.?/gi, "AV").replace(/\bNte\.?/gi, "NORTE");
  return parsearDireccion(primera);
}
const numeroInicial = s => { const m = /^\s*(\d+)/.exec(s || ""); return m ? +m[1] : null; };
const mismaVia = (a, b) => !!(viaPrincipal(a) && viaPrincipal(b)) &&
  clave(viaPrincipal(a)).replace(/^avenida(?=calle|carrera)/, "") === clave(viaPrincipal(b)).replace(/^avenida(?=calle|carrera)/, "");

/** Compara la dirección del candidato con la registrada. */
function compararDireccion(reg, cand) {
  const r = {placa: false, coherente: false, misma: false};
  if (!reg.tipo || !cand.tipo) return r;
  r.misma = mismaVia(reg, cand);
  if (r.misma && reg.cruce && reg.placa && cand.cruce && cand.placa &&
      clave(reg.cruce + reg.placa) === clave(cand.cruce + cand.placa)) r.placa = true;
  if (r.misma && numeroInicial(cand.cruce) !== null && numeroInicial(reg.cruce) !== null)
    r.coherente = Math.abs(numeroInicial(cand.cruce) - numeroInicial(reg.cruce)) <= 1;
  // El local está sobre la vía del cruce con una placa que corresponde a la vía principal
  if (!r.coherente && reg.cruce && reg.numero) {
    const sobreCruce = tiposCruce(reg).some(t => clave(viaPrincipal(cand)) === clave(`${t} ${reg.cruce}`));
    if (sobreCruce && numeroInicial(cand.cruce) !== null)
      r.coherente = Math.abs(numeroInicial(cand.cruce) - numeroInicial(reg.numero)) <= 2;
  }
  return r;
}

/* ============================== Nombre del PDV ============================== */
function analizarNombre(pdv, sap) {
  const n = {original: String(pdv ?? ""), marca: null, marcaBusqueda: null, alias: [], ciudadesMarca: [],
    sucursal: [], nucleo: [], municipioNombre: null, codigoTienda: null};
  const texto = sinAcentos(n.original).toUpperCase();
  const m = /^\s*(\d{3,4})\s*-/.exec(texto) || /\bSAO\s+(\d{2,3})\b/.exec(texto);
  if (m) n.codigoTienda = m[1];
  let toks = tokens(texto).filter(t => t !== String(sap ?? "").trim() && t !== n.codigoTienda);
  for (const [cod, busq, alias, ciudades] of MARCAS) {
    if (alias.some(a => contieneSeq(toks, a))) {
      Object.assign(n, {marca: cod, marcaBusqueda: busq, alias, ciudadesMarca: ciudades});
      for (const a of alias) for (let i = 0; i <= toks.length - a.length; i++)
        if (a.every((t, j) => toks[i + j] === t)) toks.splice(i, a.length, ...Array(a.length).fill("\0"));
      toks = toks.filter(t => t !== "\0");
      break;
    }
  }
  for (const [seq, muni] of ALIAS_MUNICIPIO)
    if (contieneSeq(toks, seq)) { n.municipioNombre = muni; toks = toks.filter(t => !seq.includes(t)); }
  for (const muni of Object.keys(DEPARTAMENTOS).sort((a, b) => b.length - a.length)) {
    const seq = muni.split(" ");
    if (contieneSeq(toks, seq)) { n.municipioNombre = n.municipioNombre || muni; toks = toks.filter(t => !seq.includes(t)); }
  }
  toks = expandir(toks);
  n.nucleo = toks.filter(t => !GENERICAS.has(t));
  n.sucursal = n.marca ? [...n.nucleo] : [];
  return n;
}
const terminoSede = n => [n.marcaBusqueda, ...n.sucursal.map(titulo)].filter(Boolean).join(" ") || n.original;
const nombreLimpio = n => [n.marcaBusqueda, ...n.nucleo.map(titulo)].filter(Boolean).join(" ") || n.original;

function evaluarNombre(n, c) {
  if (!c.esTienda) return {ok: false, frac: 0};
  const tn = expandir(tokens(c.nombre)), td = expandir(tokens(c.direccion));
  if (n.marca) {
    const ajenos = FARMACIAS.has(n.marca) ? AJENOS_FARMACIA : AJENOS;
    const ok = n.alias.some(a => contieneSeq(tn, a)) && !tn.some(t => ajenos.has(t));
    if (!n.sucursal.length) return {ok, frac: 1};
    const sede = n.sucursal.filter(t => !SEDE_GENERICA.has(t));
    const usar = sede.length ? sede : n.sucursal;
    const pts = usar.reduce((s, t) => s + (tn.includes(t) ? 1 : td.includes(t) && !SEDE_GENERICA.has(t) && !/^\d+$/.test(t) ? .5 : 0), 0);
    return {ok, frac: pts / usar.length};
  }
  if (!n.nucleo.length) return {ok: false, frac: 0};
  const frac = n.nucleo.filter(t => tn.includes(t)).length / n.nucleo.length;
  return {ok: frac >= .99, frac};
}
function palabrasExtra(n, c) {
  const propias = new Set([...n.alias.flat(), ...n.sucursal, ...GENERICAS, ...SEDE_GENERICA,
    "WOW","CC","COMERCIAL","ALMACEN","SUPERALMACEN", ...Object.keys(DEPARTAMENTOS).flatMap(m => m.split(" "))]);
  return new Set(expandir(tokens(c.nombre)).filter(t => !propias.has(t))).size;
}

/* ============================== Geometría ============================== */
function distancia(a1, o1, a2, o2) {
  const r = 6371008.8, p1 = a1 * Math.PI / 180, p2 = a2 * Math.PI / 180;
  const dp = p2 - p1, dl = (o2 - o1) * Math.PI / 180;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}
function agrupar(lista, radio = 150) {
  const grupos = [];
  for (const e of lista) {
    const g = grupos.find(g => distancia(e.c.lat, e.c.lon, g[0].c.lat, g[0].c.lon) <= radio);
    g ? g.push(e) : grupos.push([e]);
  }
  return grupos;
}

/* ============================== Caché y red ============================== */
const memoria = new Map();
function cacheGet(k) {
  if (memoria.has(k)) return memoria.get(k);
  try { const v = localStorage.getItem("geo:" + k); if (v) { const o = JSON.parse(v); memoria.set(k, o); return o; } } catch (e) {}
  return undefined;
}
function cacheSet(k, v) {
  memoria.set(k, v);
  try { localStorage.setItem("geo:" + k, JSON.stringify(v)); } catch (e) { /* almacenamiento lleno o bloqueado */ }
}
const pausa = ms => new Promise(r => setTimeout(r, ms));
/* ============================== Límite gratis de Google ============================== */
// Google da un cupo gratis al mes por tipo de consulta (búsqueda de lugares ≈ 5.000, geocodificación ≈ 10.000).
// Antes de llegar a él, la página deja de usar Google y sigue con OpenStreetMap para que no se generen cobros.
const LIMITE_GOOGLE = {places: 4500, geocoding: 9000};
// Uso del mes ya registrado en la consola de Google antes de activar este control
const USO_INICIAL_GOOGLE = {"2026-10": {places: 1366, geocoding: 419}};
const mesActual = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
function leerUsoGoogle() {
  const mes = mesActual();
  let uso = null;
  try { uso = JSON.parse(localStorage.getItem(`geo_uso_google_${mes}`)); } catch (e) {}
  return uso || {...(USO_INICIAL_GOOGLE[mes] || {places: 0, geocoding: 0}), agotado: false};
}
function guardarUsoGoogle(uso) { try { localStorage.setItem(`geo_uso_google_${mesActual()}`, JSON.stringify(uso)); } catch (e) {} }
const tipoGoogle = url => url.includes("places.googleapis.com") || url.includes("/api/places") ? "places"
  : url.includes("maps.googleapis.com/maps/api/geocode") || url.includes("/api/geocode") ? "geocoding" : null;
function googleAgotado() {
  const uso = leerUsoGoogle();
  return uso.agotado || uso.places >= LIMITE_GOOGLE.places || uso.geocoding >= LIMITE_GOOGLE.geocoding;
}
function marcarGoogleAgotado() { const uso = leerUsoGoogle(); uso.agotado = true; guardarUsoGoogle(uso); }
function errorLimiteGoogle() {
  const e = new Error("Se alcanzó el límite de uso gratuito de Google de este mes.");
  e.limiteGoogle = true;
  return e;
}

let ultimaConsulta = 0, consultasReales = 0;
async function solicitar(url, opciones, intervalo, llave) {
  const enCache = cacheGet(llave);
  if (enCache !== undefined) return enCache;
  // Lo que ya está en caché no cuenta; una consulta nueva a Google solo se hace si no se ha llegado al límite
  const tipo = tipoGoogle(url);
  if (tipo && googleAgotado()) throw errorLimiteGoogle();
  let error;
  for (let intento = 1; intento <= 3; intento++) {
    const espera = intervalo - (Date.now() - ultimaConsulta);
    if (espera > 0) await pausa(espera);
    ultimaConsulta = Date.now();
    try {
      const r = await fetch(url, opciones);
      consultasReales++;
      if (tipo) { const uso = leerUsoGoogle(); uso[tipo]++; guardarUsoGoogle(uso); }
      if (tipo && r.status === 429) {
        // Google avisa que se acabó la cuota: no se insiste y se pasa a OpenStreetMap
        const texto = await r.text();
        if (/RESOURCE_EXHAUSTED|quota|OVER_QUERY_LIMIT/i.test(texto) || intento === 3) { marcarGoogleAgotado(); throw errorLimiteGoogle(); }
        error = "HTTP 429"; await pausa(2000 * intento); continue;
      }
      if ([429, 500, 502, 503, 504].includes(r.status)) { error = `HTTP ${r.status}`; await pausa(2000 * intento); continue; }
      const datos = await r.json();
      if (!r.ok) {
        const msg = datos?.error?.message || datos?.error_message || `HTTP ${r.status}`;
        if (tipo && /quota|billing|RESOURCE_EXHAUSTED/i.test(msg)) { marcarGoogleAgotado(); throw errorLimiteGoogle(); }
        const e = new Error(msg); e.fatal = [400, 401, 403].includes(r.status); throw e;
      }
      if (datos.status && ["OVER_QUERY_LIMIT", "OVER_DAILY_LIMIT"].includes(datos.status)) { marcarGoogleAgotado(); throw errorLimiteGoogle(); }
      if (datos.status && ["REQUEST_DENIED", "INVALID_REQUEST"].includes(datos.status)) {
        const e = new Error(`${datos.status}: ${datos.error_message || ""}`); e.fatal = datos.status === "REQUEST_DENIED"; throw e;
      }
      cacheSet(llave, datos);
      return datos;
    } catch (e) {
      if (e.fatal || e.limiteGoogle) throw e;
      error = e.message; await pausa(1000 * intento);
    }
  }
  throw new Error(`Sin respuesta tras 3 intentos (${error})`);
}

/** Pasa la búsqueda a OpenStreetMap y deja un aviso visible (sin cifras de uso). */
function pasarAOpenStreetMap() {
  const osm = document.querySelector("input[name=prov][value=osm]");
  if (osm && !osm.checked) { osm.checked = true; osm.dispatchEvent(new Event("change", {bubbles: true})); }
  const aviso = $("#avisoLimite");
  if (aviso) {
    aviso.textContent = "Google llegó al límite de uso gratuito de este mes: la búsqueda continúa con OpenStreetMap para no generar cobros. Google vuelve a estar disponible el próximo mes.";
    aviso.classList.remove("hidden");
  }
  return OSM;
}

/* ============================== Proveedor Google ============================== */
// Proxy de la rama Proxy (Railway): guarda la API key en el servidor. Si hay URL, la página no pide clave.
const PROXY_GEO = "";
const usaProxy = () => Boolean(PROXY_GEO);
const Google = {
  nombre: "Google Places API",
  campos: "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.addressComponents",
  key: "",
  async buscar(texto, centro) {
    const cuerpo = {textQuery: texto, languageCode: "es", regionCode: "CO", pageSize: 10};
    if (centro) cuerpo.locationBias = {circle: {center: {latitude: centro.lat, longitude: centro.lon}, radius: centro.radio || 5000}};
    const datos = await solicitar(usaProxy() ? `${PROXY_GEO}/api/places` : "https://places.googleapis.com/v1/places:searchText", {
      method: "POST", headers: usaProxy() ? {"Content-Type": "application/json"}
        : {"Content-Type": "application/json", "X-Goog-Api-Key": this.key, "X-Goog-FieldMask": this.campos},
      body: JSON.stringify(cuerpo)}, 200, "gp|" + JSON.stringify(cuerpo));
    return (datos.places || []).filter(p => p.location).map(p => {
      const comps = p.addressComponents || [];
      const comp = t => (comps.find(c => (c.types || []).includes(t)) || {}).longText || "";
      const tipos = p.types || [];
      return {fuente: this.nombre, nombre: p.displayName?.text || "", direccion: p.formattedAddress || "",
        lat: p.location.latitude, lon: p.location.longitude, id: p.id,
        municipio: comp("locality") || comp("administrative_area_level_2"),
        municipios: [comp("locality"), comp("administrative_area_level_2")],
        pais: ((comps.find(c => (c.types || []).includes("country")) || {}).shortText || "").toLowerCase(),
        esTienda: tipos.some(t => TIPOS_TIENDA.has(t)), esCC: tipos.includes("shopping_mall")};
    });
  },
  async geocodificar(texto) {
    const params = {address: texto, components: "country:CO", language: "es"};
    const url = usaProxy() ? `${PROXY_GEO}/api/geocode?` + new URLSearchParams(params)
      : "https://maps.googleapis.com/maps/api/geocode/json?" + new URLSearchParams({...params, key: this.key});
    const datos = await solicitar(url, {}, 200, "gg|" + texto);
    for (const r of datos.results || []) {
      const tipo = r.geometry.location_type;
      const comps = r.address_components || [];
      const comp = t => (comps.find(c => c.types.includes(t)) || {}).long_name || "";
      if ((r.types || []).includes("locality") || (r.types || []).includes("political")) {
        return {lat: r.geometry.location.lat, lon: r.geometry.location.lng, precision: "CIUDAD",
          municipio: comp("locality") || comp("administrative_area_level_2"), descripcion: r.formatted_address, id: r.place_id};
      }
      return {lat: r.geometry.location.lat, lon: r.geometry.location.lng,
        precision: tipo === "ROOFTOP" ? "EXACTA" : tipo === "RANGE_INTERPOLATED" ? "INTERPOLADA" : "APROXIMADA",
        municipio: comp("locality") || comp("administrative_area_level_2"),
        municipios: [comp("locality"), comp("administrative_area_level_2")], descripcion: r.formatted_address, id: r.place_id};
    }
    return null;
  },
};

/* ============================== Proveedor OpenStreetMap ============================== */
const OSM = {
  nombre: "OpenStreetMap/Nominatim",
  async nominatim(params) {
    const p = new URLSearchParams({format: "jsonv2", countrycodes: "co", addressdetails: 1, namedetails: 1,
      extratags: 1, "accept-language": "es", limit: 10, ...params});
    return solicitar("https://nominatim.openstreetmap.org/search?" + p, {}, 1100, "osm|" + p);
  },
  convertir(r) {
    const ad = r.address || {}, nd = r.namedetails || {}, et = r.extratags || {};
    const nombre = [...new Set([r.name, nd.name, et.brand, et.branch].filter(Boolean))].join(" ") || r.name || "";
    return {fuente: this.nombre, nombre, direccion: r.display_name || "", lat: +r.lat, lon: +r.lon,
      id: `${r.osm_type}/${r.osm_id}`, municipio: ad.city || ad.town || ad.village || ad.municipality || ad.county || "",
      municipios: [...Object.values(ad), ...String(r.display_name || "").split(",")].map(s => String(s).trim()),
      pais: ad.country_code || "", esTienda: ["shop", "amenity", "building"].includes(r.category),
      esCC: r.type === "mall", via: ad.road || "", placa: ad.house_number || ""};
  },
  async buscar(texto, centro) {
    const params = {q: texto};
    if (centro) { const g = (centro.radio || 5000) / 111000;
      params.viewbox = `${centro.lon - g},${centro.lat + g},${centro.lon + g},${centro.lat - g}`; params.bounded = 1; params.limit = 20; }
    return (await this.nominatim(params)).filter(r => !["highway", "place", "boundary"].includes(r.category)).map(r => this.convertir(r));
  },
  async geocodificar(texto) {
    const res = await this.nominatim({q: texto, limit: 5});
    const r = res[0];
    if (!r) return null;
    const ad = r.address || {};
    const exacta = !!ad.house_number;
    const ciudad = ["place", "boundary"].includes(r.category);
    return {lat: +r.lat, lon: +r.lon, precision: ciudad ? "CIUDAD" : exacta ? "EXACTA" : "APROXIMADA",
      municipio: ad.city || ad.town || ad.village || ad.municipality || ad.county || "",
      municipios: [...Object.values(ad), ...String(r.display_name || "").split(",")].map(s => String(s).trim()),
      descripcion: r.display_name, id: `${r.osm_type}/${r.osm_id}`};
  },
};

/* ============================== Georreferenciación de un registro ============================== */
const sinArticulo = k => k.replace(/^(el|la|los|las)(?=[a-z]{4,})/, "");
const mismoMunicipio = (texto, codigo) => {
  const k = sinArticulo(clave(texto).replace(/^perimetrourbano|ciudad$/g, ""));
  const n = sinArticulo(clave(nombreMunicipio(codigo)));
  return !!k && (k === sinArticulo(clave(codigo)) || k === n || k.startsWith(n));
};
async function centroCiudad(prov, codigo) {
  const llave = `centro|${prov.nombre}|${codigo}`;
  const c = cacheGet(llave);
  if (c !== undefined) return c;
  const depto = DEPARTAMENTOS[codigo];
  const g = await prov.geocodificar(`${nombreMunicipio(codigo)}${depto && depto !== nombreMunicipio(codigo) ? ", " + depto : ""}, Colombia`);
  const res = g ? {lat: g.lat, lon: g.lon, radio: 15000} : null;
  cacheSet(llave, res);
  return res;
}

async function georreferenciar(fila, prov) {
  const obs = [diagnostico(fila.lat, fila.lon) + "."];
  const nom = analizarNombre(fila.nombre, fila.id);
  const d = parsearDireccion(fila.direccion);
  const ciudad = String(fila.ciudad ?? "").trim();
  const codCiudad = codigoMunicipio(ciudad);
  if (nom.codigoTienda) obs.push(`Código de tienda en el nombre: ${nom.codigoTienda}.`);
  if (d.problemas.length && !d.ausente) obs.push("Dirección: " + d.problemas.join("; ") + ".");
  if (d.ausente) obs.push("Sin dirección: se busca por nombre y ciudad.");
  const res = {estado: "", tipo: "", nombre: "", direccion: "", ciudad: "", lat: null, lon: null, fuente: "", id: "", obs};

  // Municipios aceptables: el registrado, el que indica el nombre, su área metropolitana y las ciudades de la cadena
  const muniDireccion = !d.ausente && !utilizable(d) ? Object.keys(DEPARTAMENTOS).find(m => clave(m) === clave(d.original)) : null;
  const principales = [codCiudad, nom.municipioNombre, muniDireccion].filter((v, i, a) => v && a.indexOf(v) === i);
  const vecinos = [...(AREA_METROPOLITANA[codCiudad] || []), ...nom.ciudadesMarca].filter(m => !principales.includes(m));
  const enMunicipio = (o, m) => (o.municipios || [o.municipio]).some(t => mismoMunicipio(t, m));
  const municipioDe = o => o ? [...principales, ...vecinos].find(m => enMunicipio(o, m)) || null : null;

  const centro = ciudad ? await centroCiudad(prov, codCiudad) : null;
  // P2: dirección normalizada
  let punto = null;
  if (utilizable(d)) {
    punto = await prov.geocodificar(`${normalizada(d)}, ${titulo(ciudad)}, ${DEPARTAMENTOS[codCiudad] || ""}, Colombia`);
    if (punto && (punto.precision === "CIUDAD" || !municipioDe(punto) ||
        (punto.precision !== "EXACTA" && punto.precision !== "INTERPOLADA"))) {
      if (punto.precision !== "CIUDAD" && !municipioDe(punto)) obs.push(`La dirección se ubicó en ${punto.municipio || "otro municipio"}; no se usa.`);
      punto = punto.precision === "APROXIMADA" && municipioDe(punto) ? {...punto, soloReferencia: true} : null;
    }
    if (punto && !punto.soloReferencia && prov === Google) {
      const dg = parsearDireccionGoogle(punto.descripcion);
      const cruceDistinto = numeroInicial(d.cruce) !== null && numeroInicial(dg.cruce) !== null &&
        Math.abs(numeroInicial(d.cruce) - numeroInicial(dg.cruce)) > 1;
      if (dg.tipo && (!mismaVia(d, dg) || cruceDistinto)) {
        obs.push(`Google ubicó la dirección en otra vía (${String(punto.descripcion).split(",")[0]}); se usa solo como referencia.`);
        punto = {...punto, soloReferencia: true};
      }
    }
  }
  // P1 / P3: nombre + dirección + ciudad, y sede + ciudad
  // Google recibe la ciudad dentro del texto; OSM limita la búsqueda al área de la ciudad
  const conCiudad = (texto, muni) => prov === Google ? `${texto} ${muni}` : texto;
  const sede = nom.marca ? terminoSede(nom) : nombreLimpio(nom);
  const sesgo = punto && !punto.soloReferencia ? {lat: punto.lat, lon: punto.lon, radio: 2000} : centro;
  const consultas = [];
  if (!d.ausente && normalizada(d)) consultas.push([`${nombreLimpio(nom)}, ${normalizada(d)}, ${titulo(ciudad)}`, null]);
  consultas.push([conCiudad(sede, titulo(ciudad)), sesgo]);
  if (nom.marca) consultas.push([conCiudad(nom.marcaBusqueda, titulo(ciudad)), sesgo]);
  if (nom.municipioNombre && nom.municipioNombre !== codCiudad) {
    const cm = await centroCiudad(prov, nom.municipioNombre);
    consultas.push([conCiudad(sede, nombreMunicipio(nom.municipioNombre)), cm]);
  }
  // Coincidencia fuerte: nombre y sede coinciden, está en la ciudad y, si hay dirección, cerca de ella.
  // Con una así no hace falta seguir buscando (cada búsqueda en Google consume cupo).
  const fuerte = lista => lista.some(c => {
    const e = evaluarNombre(nom, c);
    if (!e.ok || !principales.some(m => enMunicipio(c, m))) return false;
    if (nom.marca && nom.sucursal.length && e.frac < .99) return false;
    if (punto && !punto.soloReferencia) return distancia(c.lat, c.lon, punto.lat, punto.lon) <= 300;
    // Si hay dirección pero no se pudo ubicar con precisión, falta evidencia (p. ej. el centro comercial): se sigue buscando
    return !utilizable(d);
  });
  let cands = [];
  const hechas = new Set();
  for (const [q, s] of consultas) {
    const k = q + JSON.stringify(s);
    if (hechas.has(k)) continue;
    hechas.add(k);
    cands.push(...await prov.buscar(q, s));
    if (fuerte(cands)) break;
  }
  // Búsqueda en municipios vecinos si no hay una sede probable en la ciudad registrada.
  // Con Google solo se busca donde cayó la dirección y en las ciudades propias de la cadena, no en toda el área.
  const probable = lista => lista.some(c => { const e = evaluarNombre(nom, c); return e.ok && e.frac >= (nom.sucursal.length ? .5 : 1) && principales.some(m => enMunicipio(c, m)); });
  const vecinosABuscar = prov === Google
    ? [punto && vecinos.find(m => enMunicipio(punto, m)), ...nom.ciudadesMarca.filter(m => vecinos.includes(m))].filter((v, i, a) => v && a.indexOf(v) === i)
    : vecinos;
  if (!probable(cands)) for (const m of vecinosABuscar) {
    const cm = await centroCiudad(prov, m);
    cands.push(...await prov.buscar(conCiudad(sede, nombreMunicipio(m)), cm));
    if (fuerte(cands) || probable(cands.filter(c => enMunicipio(c, m)))) break;
  }
  // Centros comerciales nombrados en la sede (p. ej. "Plaza Salitre", "Cosmocentro"); solo si aún no hay coincidencia fuerte
  const sedeCC = nom.sucursal.filter(t => !SEDE_GENERICA.has(t) && !/^\d+$/.test(t) && t !== "COMERCIAL");
  let centros = [];
  if (sedeCC.length && !fuerte(cands)) {
    const cc = await prov.buscar(conCiudad(`Centro Comercial ${sedeCC.map(titulo).join(" ")}`, titulo(ciudad)), centro);
    centros = cc.filter(c => { const tn = new Set(expandir(tokens(c.nombre)));
      return (c.esCC || (tn.has("CENTRO") && tn.has("COMERCIAL")) || tn.has("MALL")) && sedeCC.every(t => tn.has(t)) && municipioDe(c); });
  }
  // Deduplicar
  const vistos = new Set();
  cands = cands.filter(c => !vistos.has(c.id) && vistos.add(c.id));

  const evaluados = [];
  for (const c of cands) {
    const {ok, frac} = evaluarNombre(nom, c);
    if (!ok) continue;
    const muni = municipioDe(c);
    if (!muni) continue;
    const dc = c.via ? parsearDireccion(`${c.via} ${c.placa}`.replace(/^Avenida /i, "AV ").replace(/^Calle /i, "CL ").replace(/^Carrera /i, "CR "))
                     : parsearDireccionGoogle(c.direccion);
    const comp = compararDireccion(d, dc);
    const dPto = punto ? distancia(c.lat, c.lon, punto.lat, punto.lon) : null;
    const dCC = centros.length ? Math.min(...centros.map(m => distancia(c.lat, c.lon, m.lat, m.lon))) : null;
    evaluados.push({c, frac, muni, comp, dPto, dCC: dCC !== null && dCC <= 200 ? dCC : null, extra: palabrasExtra(nom, c)});
  }
  const marcaSinSede = nom.marca && !nom.sucursal.length;
  for (const e of evaluados) {
    const sedeExacta = (nom.sucursal.length && e.frac >= .99) || (marcaSinSede && agrupar(evaluados.filter(x => x.muni === e.muni)).length === 1);
    const lim = sedeExacta ? 300 : 150;
    e.dirOk = e.comp.placa || e.comp.coherente || e.dCC !== null ||
      (e.dPto !== null && !punto.soloReferencia && e.dPto <= lim);
  }
  const infoDireccion = (punto && !punto.soloReferencia) || centros.length > 0;
  const fuerza = e => [e.comp.placa || e.comp.coherente ? 1 : 0, e.frac, -e.extra, -(e.dPto ?? 0)];
  const mayor = (a, b) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] > b[i]; return false; };
  let elegido = null;
  if (infoDireccion) {
    const ok = evaluados.filter(e => e.dirOk);
    if (ok.length) {
      ok.sort((a, b) => mayor(fuerza(a), fuerza(b)) ? -1 : 1);
      const grupos = agrupar(ok);
      if (grupos.length === 1) elegido = ok[0];
      else {
        const seg = ok.find(e => distancia(e.c.lat, e.c.lon, ok[0].c.lat, ok[0].c.lon) > 150);
        const f0 = fuerza(ok[0]).slice(0, 3), f1 = fuerza(seg).slice(0, 3);
        if (mayor(f0, f1)) elegido = ok[0];
        else { res.estado = "REVISAR"; obs.push(`${grupos.length} sedes compatibles con la dirección: ` +
          grupos.slice(0, 4).map(g => `${g[0].c.nombre} (${fmt(g[0].c.lat, g[0].c.lon)})`).join(" | ") + "."); }
      }
    } else if (evaluados.length) {
      const cerca = evaluados.slice().sort((a, b) => (a.dPto ?? 1e9) - (b.dPto ?? 1e9))[0];
      if (cerca.frac >= .5 && cerca.dPto !== null && cerca.dPto <= 600) {
        res.estado = "REVISAR"; res.tipo = "DISCREPANCIA_DIRECCION";
        Object.assign(res, {nombre: cerca.c.nombre, direccion: cerca.c.direccion, ciudad: cerca.c.municipio, fuente: cerca.c.fuente, id: cerca.c.id});
        obs.push(`Se encontró '${cerca.c.nombre}' a ${Math.round(cerca.dPto)} m de la dirección registrada; candidato ${fmt(cerca.c.lat, cerca.c.lon)}.`);
      } else obs.push(`Las sedes de la marca encontradas no corresponden a la dirección` +
        (cerca.dPto !== null ? ` (la más cercana, '${cerca.c.nombre}', está a ${Math.round(cerca.dPto)} m).` : "."));
    }
  } else {
    const fuertes = nom.marca ? evaluados.filter(e => e.frac >= (nom.sucursal.length ? .5 : 1)) : evaluados;
    const grupos = agrupar(fuertes);
    const mejores = grupos.map(g => g.slice().sort((a, b) => mayor(fuerza(a), fuerza(b)) ? -1 : 1)[0])
      .sort((a, b) => mayor(fuerza(a), fuerza(b)) ? -1 : 1);
    if (mejores.length === 1 || (mejores.length > 1 && mayor(fuerza(mejores[0]).slice(0, 3), fuerza(mejores[1]).slice(0, 3)))) {
      elegido = mejores[0];
      elegido.soloNombre = utilizable(d) && !elegido.comp.placa && !elegido.comp.coherente;
      obs.push("Sede identificada por nombre y municipio; la dirección no permitió verificarla" +
        (mejores.length > 1 ? ` (se descartaron ${mejores.length - 1} sedes con nombre menos preciso).` : "."));
    } else if (mejores.length > 1) {
      res.estado = "REVISAR";
      obs.push(`${mejores.length} sedes posibles con ese nombre: ` + mejores.slice(0, 4).map(e => `${e.c.nombre} (${fmt(e.c.lat, e.c.lon)})`).join(" | ") + ".");
    } else if (evaluados.length) {
      res.estado = "REVISAR";
      obs.push(`Hay ${agrupar(evaluados).length} sede(s) de la marca en la zona, pero ninguna coincide con el nombre de la sede: ` +
        agrupar(evaluados).slice(0, 4).map(g => `${g[0].c.nombre} (${fmt(g[0].c.lat, g[0].c.lon)})`).join(" | ") + ".");
    }
  }

  if (elegido) {
    const c = elegido.c;
    Object.assign(res, {nombre: c.nombre, direccion: c.direccion, ciudad: nombreMunicipio(elegido.muni), fuente: c.fuente, id: c.id,
      tipo: elegido.comp.placa ? "SEDE_IDENTIFICADA_DIRECCION_COINCIDENTE" : "SEDE_IDENTIFICADA", estado: "GEORREFERENCIADO"});
    const partes = [];
    if (elegido.comp.placa) partes.push("la placa coincide");
    else if (elegido.comp.coherente) partes.push("nomenclatura coherente con la dirección");
    if (elegido.dCC !== null) partes.push(`${Math.round(elegido.dCC)} m del centro comercial`);
    if (elegido.dPto !== null && !punto.soloReferencia) partes.push(`${Math.round(elegido.dPto)} m del punto de la dirección`);
    if (partes.length) obs.push("Validación: " + partes.join(", ") + ".");
    const compl = new Set(expandir(tokens(d.complemento)));
    const ccEnDireccion = elegido.dCC !== null && nom.sucursal.some(t => !SEDE_GENERICA.has(t) && compl.has(t));
    if (elegido.dPto !== null && !punto.soloReferencia && elegido.dPto > 1000 && !elegido.comp.placa) {
      if (ccEnDireccion) obs.push(`La parte numérica de la dirección se ubica a ${(elegido.dPto / 1000).toFixed(1)} km, pero la dirección cita el mismo centro comercial.`);
      else { res.estado = "REVISAR"; res.tipo = "DISCREPANCIA_DIRECCION";
        obs.push(`DISCREPANCIA: la sede se identificó por nombre, pero la dirección registrada está a ${(elegido.dPto / 1000).toFixed(1)} km; confirmar cuál es la correcta.`); }
    }
    if (!enColombia(c.lat, c.lon) || (c.pais && c.pais !== "co")) { res.estado = "REVISAR"; obs.push("Las coordenadas no están en Colombia."); }
    if (elegido.soloNombre) {
      res.estado = "REVISAR";
      obs.push("La sede coincide por nombre, pero la dirección registrada no se pudo verificar en el mapa: confirmar que sea la misma.");
    }
    if (!principales.includes(elegido.muni) || !enMunicipio(c, codCiudad)) {
      if (!enMunicipio(c, codCiudad)) {
        const fuerte = elegido.comp.placa || elegido.comp.coherente || (elegido.dPto !== null && elegido.dPto <= 200);
        if (elegido.muni === nom.municipioNombre || fuerte)
          obs.push(`ATENCIÓN: la ciudad registrada '${ciudad}' no coincide; la sede está en ${nombreMunicipio(elegido.muni)}. Corregir la ciudad en la base.`);
        else { res.estado = "REVISAR"; obs.push(`Discrepancia de municipio: registrada '${ciudad}', sede probable en ${nombreMunicipio(elegido.muni)}.`); }
      }
    }
    const dcElegido = c.via ? null : parsearDireccionGoogle(c.direccion);
    if (dcElegido && (elegido.comp.misma || elegido.comp.coherente) && !elegido.comp.placa && dcElegido.placa && d.placa)
      obs.push(`La placa de la fuente (${dcElegido.cruce}-${dcElegido.placa}) difiere de la registrada (${d.cruce}-${d.placa}).`);
    if (res.estado === "GEORREFERENCIADO") { res.lat = +c.lat.toFixed(7); res.lon = +c.lon.toFixed(7); }
    else obs.push(`Candidato propuesto: ${fmt(c.lat, c.lon)}.`);
  } else if (!res.estado) {
    if (punto && !punto.soloReferencia && punto.precision === "EXACTA" && principales.some(m => enMunicipio(punto, m))) {
      Object.assign(res, {estado: "GEORREFERENCIADO", tipo: "DIRECCION_COINCIDENTE", direccion: punto.descripcion, ciudad: punto.municipio,
        fuente: prov === Google ? "Google Geocoding API" : prov.nombre, id: punto.id || "", lat: +punto.lat.toFixed(7), lon: +punto.lon.toFixed(7)});
      obs.push("Ubicación exacta de la dirección; el establecimiento no figura en la fuente, no es una sede verificada.");
    } else if (centros.length) {
      const m = centros[0];
      Object.assign(res, {estado: "REVISAR", tipo: "UBICACION_APROXIMADA", nombre: m.nombre, direccion: m.direccion, ciudad: m.municipio, fuente: m.fuente, id: m.id});
      obs.push(`UBICACIÓN APROXIMADA (no verificada): centro comercial '${m.nombre}' (${fmt(m.lat, m.lon)}); el local no figura en la fuente.`);
    } else if (punto) {
      Object.assign(res, {estado: "REVISAR", tipo: "UBICACION_APROXIMADA", direccion: punto.descripcion, ciudad: punto.municipio, fuente: prov.nombre});
      obs.push(`UBICACIÓN APROXIMADA (no verificada): ${punto.descripcion}, ${fmt(punto.lat, punto.lon)}; el establecimiento no se encontró en la fuente.`);
    } else {
      res.estado = "SIN_RESULTADO";
      obs.push(d.ausente ? "Sin dirección y sin coincidencia confiable por nombre y ciudad." : "No se encontró el establecimiento ni se pudo ubicar la dirección.");
    }
  }
  if (nom.ciudadesMarca.length && !nom.ciudadesMarca.includes(codCiudad) && res.estado !== "GEORREFERENCIADO")
    obs.push(`${nom.marcaBusqueda} opera principalmente en ${nom.ciudadesMarca.map(nombreMunicipio).join(", ")}; verificar la ciudad registrada.`);
  // Candidato propuesto para revisar en el mapa
  const m = /(-?\d{1,2}\.\d{5,}), (-?\d{1,3}\.\d{5,})/.exec(obs.join(" "));
  if (res.lat === null && m) {
    res.propuesta = [+m[1], +m[2]];
    if (!res.direccion) {   // dirección del lugar propuesto, para mostrarla y exportarla
      const lugar = [...cands, ...centros].find(c => Math.abs(c.lat - res.propuesta[0]) < 1e-5 && Math.abs(c.lon - res.propuesta[1]) < 1e-5);
      if (lugar) Object.assign(res, {direccion: lugar.direccion, nombre: res.nombre || lugar.nombre});
    }
  }
  return res;
}

/* ============================== Interfaz ============================== */
const $ = s => document.querySelector(s);
const CAMPOS = [
  ["id", "Código (SAP)", ["sap", "codigopdv", "codigo", "cod", "nit", "id"]],
  ["nombre", "Nombre del PDV", ["pdv", "nombrepdv", "nombre", "establecimiento", "razonsocial", "puntodeventa", "tienda"]],
  ["ciudad", "Ciudad", ["ciudad", "municipio", "poblacion"]],
  ["direccion", "Dirección", ["direccion", "dir", "domicilio"]],
  ["lat", "Latitud", ["latitud", "lat", "latitude"]],
  ["lon", "Longitud", ["longitud", "longiutd", "lon", "lng", "long", "longitude"]],
];
let libro = null, hoja = null, filas = [], columnas = [], resultados = [], detener = false, mapa = null, capa = null;

const drop = $("#drop"), inputFile = $("#file");
drop.addEventListener("click", () => inputFile.click());
drop.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") inputFile.click(); });
drop.addEventListener("dragover", e => { e.preventDefault(); drop.classList.add("over"); });
drop.addEventListener("dragleave", () => drop.classList.remove("over"));
drop.addEventListener("drop", e => { e.preventDefault(); drop.classList.remove("over"); if (e.dataTransfer.files[0]) leerArchivo(e.dataTransfer.files[0]); });
inputFile.addEventListener("change", () => inputFile.files[0] && leerArchivo(inputFile.files[0]));

async function leerArchivo(file) {
  const datos = await file.arrayBuffer();
  cargarLibro(datos, file.name);
}
function cargarLibro(datos, nombreArchivo) {
  // Sin cellDates: las fechas quedan como número de serie con su formato y se exportan idénticas
  libro = XLSX.read(datos, {type: "array"});
  nombreArchivoActual = nombreArchivo;
  const hojas = libro.SheetNames;
  $("#fileInfo").innerHTML = `<b>${escapar(nombreArchivo)}</b>` + (hojas.length > 1 ?
    ` · Hoja: <select id="sheetSel" style="width:auto">${hojas.map(h => `<option>${escapar(h)}</option>`).join("")}</select>` : ` · Hoja: ${escapar(hojas[0])}`);
  const sel = $("#sheetSel");
  if (sel) sel.addEventListener("change", () => cargarHoja(sel.value));
  cargarHoja(hojas[0]);
}
let nombreArchivoActual = "";
function cargarHoja(nombre) {
  hoja = nombre;
  filas = XLSX.utils.sheet_to_json(libro.Sheets[nombre], {defval: "", raw: true});
  columnas = filas.length ? Object.keys(filas[0]) : [];
  $("#fileInfo").insertAdjacentHTML("beforeend", "");
  $("#fileInfo").dataset.count = filas.length;
  const info = $("#fileInfo");
  info.querySelector(".cnt")?.remove();
  info.insertAdjacentHTML("beforeend", `<span class="cnt"> · ${filas.length} registros, ${columnas.length} columnas</span>`);
  $("#mapping").innerHTML = CAMPOS.map(([k, etiqueta, re]) => {
    const det = detectarColumna(columnas, re);
    return `<div><label for="map_${k}">${etiqueta}</label><select id="map_${k}"><option value="">(no usar)</option>` +
      columnas.map(c => `<option${c === det ? " selected" : ""}>${escapar(c)}</option>`).join("") + "</select></div>";
  }).join("");
  ["#cfg", "#prov"].forEach(s => $(s).classList.remove("hidden"));
  const revisar = () => { const m = mapeo(); revisarColumnas("#cfgAviso", "#cfgDetalle",
    [!m.nombre && "nombre del PDV", !m.ciudad && "ciudad"].filter(Boolean)); };
  $("#mapping").querySelectorAll("select").forEach(s => s.addEventListener("change", revisar));
  revisar();
  resultados = [];
  $("#geoResults").classList.add("hidden");
}
const escapar = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const mapeo = () => Object.fromEntries(CAMPOS.map(([k]) => [k, $("#map_" + k).value]));

// Proveedor y clave
const radios = document.querySelectorAll("input[name=prov]");
// Con el proxy la clave está en el servidor: no se muestra la casilla de la API key
const ajustarCajaClave = () => $("#keyBox").classList.toggle("hidden",
  usaProxy() || document.querySelector("input[name=prov]:checked")?.value === "osm");
radios.forEach(r => r.addEventListener("change", ajustarCajaClave));
ajustarCajaClave();
try { const k = localStorage.getItem("geo_apikey"); if (k) { $("#apikey").value = k; $("#remember").checked = true; } } catch (e) {}
// Si este mes ya se llegó al límite gratis de Google, se usa OpenStreetMap aunque se elija Google
radios.forEach(r => r.addEventListener("change", () => { if (r.value === "google" && r.checked && googleAgotado()) pasarAOpenStreetMap(); }));
if (googleAgotado() && document.querySelector("input[name=prov]:checked")?.value === "google") pasarAOpenStreetMap();

$("#stop").addEventListener("click", () => { detener = true; $("#stop").disabled = true; });
$("#run").addEventListener("click", ejecutar);

async function ejecutar() {
  const m = mapeo();
  if (!m.nombre || !m.ciudad) { estado("Selecciona al menos las columnas de nombre y ciudad.", true); return; }
  const provNombre = document.querySelector("input[name=prov]:checked").value;
  let prov = provNombre === "google" ? Google : OSM;
  if (prov === Google && googleAgotado()) prov = pasarAOpenStreetMap();
  if (prov === Google && !usaProxy()) {
    Google.key = $("#apikey").value.trim();
    if (!Google.key) { estado("Ingresa la API key de Google o elige OpenStreetMap.", true); return; }
    try { $("#remember").checked ? localStorage.setItem("geo_apikey", Google.key) : localStorage.removeItem("geo_apikey"); } catch (e) {}
  }
  const limite = $("#testMode").checked ? 5 : filas.length;
  detener = false; consultasReales = 0;
  $("#run").disabled = true; $("#stop").disabled = false;
  resultados = filas.map(() => null);
  $("#geoResults").classList.remove("hidden");
  for (let i = 0; i < Math.min(limite, filas.length); i++) {
    if (detener) break;
    const f = filas[i];
    const fila = {id: f[m.id], nombre: f[m.nombre], ciudad: f[m.ciudad], direccion: m.direccion ? f[m.direccion] : "",
      lat: m.lat ? f[m.lat] : "", lon: m.lon ? f[m.lon] : ""};
    estado(`Procesando ${i + 1} de ${limite}: ${fila.nombre}`);
    $("#progress div").style.width = `${(i / limite) * 100}%`;
    if (esSinGeo(fila.lat, fila.lon) && !$("#buscarSinGeo").checked) {
      resultados[i] = {estado: "SIN_GEO", tipo: "", nombre: "", direccion: "", ciudad: "", lat: null, lon: null, fuente: "", id: "",
        obs: ["Registro marcado 'sin geo' en la base: se conserva tal cual, sin procesar."]};
    } else {
      try { resultados[i] = await georreferenciar(fila, prov); }
      catch (e) {
        // Límite gratis de Google: se repite este registro con OpenStreetMap y se sigue con él
        if (e.limiteGoogle && prov === Google) { prov = pasarAOpenStreetMap(); i--; continue; }
        resultados[i] = {estado: "ERROR", tipo: "", nombre: "", direccion: "", ciudad: "", lat: null, lon: null, fuente: prov.nombre, id: "",
          obs: [`Falló la consulta: ${e.message}`]};
        if (e.fatal) { estado(`El servicio rechazó la consulta: ${e.message}. Revisa la API key y que estén habilitadas Places API (New) y Geocoding API.`, true); break; }
      }
    }
    pintar();
  }
  $("#progress div").style.width = "100%";
  $("#run").disabled = false; $("#stop").disabled = true;
  const hechos = resultados.filter(Boolean).length;
  if (!$("#status").classList.contains("err"))
    estado(`Listo: ${hechos} registros procesados${detener ? " (detenido)" : ""}. Consultas nuevas al servicio: ${consultasReales}.` +
      ($("#testMode").checked && filas.length > 5 ? " Si los resultados se ven bien, desmarca el modo prueba y ejecuta de nuevo; lo ya consultado no se repite." : ""));
  pintar();
}
function estado(txt, error = false) { const s = $("#status"); s.textContent = txt; s.classList.toggle("err", error); }

function pintar() {
  const m = mapeo();
  const cuenta = k => resultados.filter(r => r && r.estado === k).length;
  const validasAntes = filas.filter(f => /numéricas/.test(diagnostico(f[m.lat], f[m.lon]))).length;
  $("#cards").innerHTML = [
    ["Total de puntos de venta", filas.length], ["Coordenadas válidas antes", validasAntes],
    ["Georreferenciados", cuenta("GEORREFERENCIADO")], ["Por revisar", cuenta("REVISAR")],
    ["Sin resultado", cuenta("SIN_RESULTADO")], ["Sin geo (conservados)", cuenta("SIN_GEO")], ["Errores", cuenta("ERROR")],
  ].map(([t, v]) => `<div class="card"><b>${v}</b><span>${t}</span></div>`).join("");
  const filtro = $("#filter").value;
  const cab = ["#", m.id || "Código", "PDV", "Ciudad", "Dirección", "Ubicación", "Latitud", "Longitud", "Dirección en el mapa", "Observaciones", "Mapa"];
  let html = "<thead><tr>" + cab.map(c => `<th>${escapar(c)}</th>`).join("") + "</tr></thead><tbody>";
  filas.forEach((f, i) => {
    const r = resultados[i];
    const est = r ? r.estado : "PENDIENTE";
    if (filtro && est !== filtro) return;
    const p = puntoDe(r);
    const lat = p ? p[0] : (r && r.estado === "SIN_GEO" ? f[m.lat] : "");
    const lon = p ? p[1] : (r && r.estado === "SIN_GEO" ? f[m.lon] : "");
    const punto = r && r.lat !== null ? `${r.lat},${r.lon}` : r && r.propuesta ? r.propuesta.join(",") : null;
    const q = punto || [f[m.nombre], m.direccion ? f[m.direccion] : "", f[m.ciudad], "Colombia"].filter(Boolean).join(", ");
    html += `<tr><td>${i + 1}</td><td>${escapar(f[m.id])}</td><td>${escapar(f[m.nombre])}</td><td>${escapar(f[m.ciudad])}</td>` +
      `<td>${escapar(m.direccion ? f[m.direccion] : "")}</td><td><span class="chip ${est}">${escapar(ubicacionDe(r))}</span></td>` +
      `<td>${escapar(lat)}</td><td>${escapar(lon)}</td><td>${escapar(r && r.estado !== "SIN_GEO" ? String(r.direccion || "").toUpperCase() : "")}</td>` +
      `<td class="obs">${escapar(r ? r.obs.join(" ") : "")}</td>` +
      `<td><a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}">${punto ? "Ver" : "Buscar"}</a></td></tr>`;
  });
  $("#table").innerHTML = html + "</tbody>";
  pintarMapa();
}
$("#filter").addEventListener("change", pintar);

function pintarMapa() {
  if (typeof L === "undefined") return;
  if (!mapa) {
    mapa = L.map("map").setView([4.6, -74.1], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom: 19, attribution: "© OpenStreetMap"}).addTo(mapa);
    capa = L.layerGroup().addTo(mapa);
  }
  capa.clearLayers();
  const m = mapeo(), css = getComputedStyle(document.body);
  const color = {GEORREFERENCIADO: css.getPropertyValue("--ok"), REVISAR: css.getPropertyValue("--warn")};
  const puntos = [];
  resultados.forEach((r, i) => {
    if (!r) return;
    const p = r.lat !== null ? [r.lat, r.lon] : r.propuesta;
    if (!p) return;
    puntos.push(p);
    L.circleMarker(p, {radius: 7, color: color[r.estado] || "#888", fillOpacity: r.lat !== null ? .85 : .15, weight: 2})
      .bindPopup(`<b>${escapar(filas[i][m.nombre])}</b><br>${escapar(r.estado)}${r.lat === null ? " (candidato)" : ""}<br>${escapar(r.nombre || r.direccion)}`)
      .addTo(capa);
  });
  if (puntos.length) mapa.fitBounds(puntos, {padding: [30, 30], maxZoom: 15});
}

/* ============================== Excel de salida ============================== */
$("#download").addEventListener("click", descargar);
/** Punto en el mapa para la fila: el validado o, si quedó por revisar, el candidato propuesto. */
const puntoDe = r => !r || r.estado === "SIN_GEO" ? null : r.lat !== null ? [r.lat, r.lon] : r.propuesta || null;
const ubicacionDe = r => !r ? "NO PROCESADA" : r.estado === "SIN_GEO" ? "SIN GEO" :
  r.estado === "GEORREFERENCIADO" ? "VERIFICADA" : puntoDe(r) ? "POR CONFIRMAR" : "NO ENCONTRADA";

function descargar() {
  const m = mapeo(), detalle = $("#detalle").checked;
  const pendientes = resultados.filter(r => !r).length;
  if (!resultados.length || pendientes === filas.length) { estado("Primero pulsa Georreferenciar.", true); return; }
  if (pendientes && !confirm(`Solo se procesaron ${filas.length - pendientes} de ${filas.length} registros` +
      `${$("#testMode").checked ? " (modo prueba activado)" : ""}. Los ${pendientes} restantes saldrán sin coordenadas.\n\n¿Descargar de todas formas?`)) return;
  // Se copia la hoja original celda por celda (tipos y formatos intactos)
  const ws = JSON.parse(JSON.stringify(libro.Sheets[hoja]));
  const rango = XLSX.utils.decode_range(ws["!ref"]);
  const cabecera = [];
  for (let c = rango.s.c; c <= rango.e.c; c++) { const celda = ws[XLSX.utils.encode_cell({r: rango.s.r, c})]; cabecera.push(celda ? String(celda.v) : ""); }
  const colLat = cabecera.indexOf(m.lat) + rango.s.c, colLon = cabecera.indexOf(m.lon) + rango.s.c;
  // GEO_OK: "OK" si quedó con geo (verificada o por confirmar), "NA" si no; si el archivo no la trae, se agrega
  const iGeoOk = cabecera.findIndex(h => /^GEO[_\s]?OK$/i.test(h.trim())), colGeoOk = iGeoOk + rango.s.c;
  const nuevas = iGeoOk < 0 ? ["GEO_OK"] : [];
  if (detalle) nuevas.push("LATITUD_ORIGINAL", "LONGITUD_ORIGINAL", "NOMBRE_ENCONTRADO", "CIUDAD_ENCONTRADA",
    "ESTADO_GEORREFERENCIACION", "FUENTE_COORDENADAS", "PLACE_ID", "TIPO_COINCIDENCIA", "OBSERVACIONES");
  const extra = [nuevas];
  filas.forEach((f, i) => {
    const r = resultados[i], fila = rango.s.r + 1 + i, p = puntoDe(r);
    // LATITUD/LONGITUD: coordenada del mapa; "sin geo" se conserva; sin ubicación queda vacía (no "4")
    if (r && r.estado !== "SIN_GEO") {
      // Si no se encontró y el registro venía «Sin Geo», se conserva ese texto en vez de dejarlo vacío
      const original = esSinGeo(f[m.lat], f[m.lon]);
      // Como texto, para que salgan con punto decimal aunque Excel esté en español (que muestra coma)
      const lat = {t: "s", v: p ? String(p[0]) : original ? String(f[m.lat]) : ""};
      const lon = {t: "s", v: p ? String(p[1]) : original ? String(f[m.lon]) : ""};
      if (m.lat) ws[XLSX.utils.encode_cell({r: fila, c: colLat})] = lat;
      if (m.lon) ws[XLSX.utils.encode_cell({r: fila, c: colLon})] = lon;
    }
    const geoOk = r ? (p ? "OK" : "NA") : null;
    if (geoOk && iGeoOk >= 0) ws[XLSX.utils.encode_cell({r: fila, c: colGeoOk})] = {t: "s", v: geoOk};
    const filaExtra = iGeoOk < 0 ? [geoOk || ""] : [];
    if (detalle) filaExtra.push(m.lat ? f[m.lat] : "", m.lon ? f[m.lon] : "", r?.nombre || "", r?.ciudad || "",
      r ? r.estado : "NO_PROCESADO", r?.fuente || "", r?.id || "", r?.tipo || "", r ? r.obs.join(" ") : "");
    extra.push(filaExtra);
  });
  if (nuevas.length) XLSX.utils.sheet_add_aoa(ws, extra, {origin: {r: rango.s.r, c: rango.e.c + 1}});
  ws["!cols"] = [...cabecera, ...nuevas].map(k => ({wch: k === "OBSERVACIONES" ? 90 : /DIRECCION|NOMBRE|PDV/.test(k) ? 40 : 14}));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, (hoja || "Datos").slice(0, 31));
  const base = (nombreArchivoActual || "puntos_de_venta").replace(/\.[^.]+$/, "").replace(/\s+/g, "_");
  if (!detalle) { XLSX.writeFile(wb, `${base}_coordenadas.xlsx`); return; }
  const cuenta = k => resultados.filter(r => r && r.estado === k).length;
  const resumen = [["Indicador", "Valor"],
    ["Total de puntos de venta", filas.length],
    ["Coordenadas válidas antes del procesamiento", filas.filter(f => /numéricas/.test(diagnostico(f[m.lat], f[m.lon]))).length],
    ["Registros georreferenciados", cuenta("GEORREFERENCIADO")], ["Registros pendientes de revisión", cuenta("REVISAR")],
    ["Registros sin resultados", cuenta("SIN_RESULTADO")], ["Registros 'sin geo' conservados", cuenta("SIN_GEO")],
    ["Errores de consulta", cuenta("ERROR")], ["Registros no procesados", resultados.filter(r => !r).length],
    [], ["Fecha", new Date().toLocaleString("es-CO")],
    ["Servicio", document.querySelector("input[name=prov]:checked").value === "google" ? "Google Places API + Geocoding API" : "OpenStreetMap/Nominatim"],
    [], ["Registros no georreferenciados y motivo"], ["Código", "PDV", "Ciudad", "Estado", "Observaciones"]];
  filas.forEach((f, i) => { const r = resultados[i];
    if (r && r.estado !== "GEORREFERENCIADO") resumen.push([f[m.id], f[m.nombre], f[m.ciudad], r.estado, r.obs.join(" ")]); });
  const wr = XLSX.utils.aoa_to_sheet(resumen);
  wr["!cols"] = [{wch: 44}, {wch: 40}, {wch: 16}, {wch: 18}, {wch: 100}];
  XLSX.utils.book_append_sheet(wb, wr, "Resumen");
  XLSX.writeFile(wb, `${base}_georreferenciado_detalle.xlsx`);
}

/* ============================== Pestañas ============================== */
// Menú "¿Qué quieres hacer?": "Descargar reporte" usa la tarjeta angosta original; las herramientas de geo, el ancho completo
function mostrarHerramienta(destino) {
  const esGeo = destino !== "t-reporte";
  $("#t-reporte").classList.toggle("hidden", esGeo);
  $("#geoComun").classList.toggle("hidden", !esGeo);
  $("#contenedor").classList.toggle("ancho", esGeo);
  ["tool1", "tool2"].forEach(id => $("#" + id).classList.toggle("hidden", id !== destino));
  const opcion = $("#herramienta").selectedOptions[0];
  $("#iconoHerramienta").textContent = opcion?.dataset.icono || "apps";
  try { localStorage.setItem("herramienta", destino); } catch (e) {}
  setTimeout(() => { mapa?.invalidateSize(); V.mapa?.invalidateSize(); }, 50);
}
$("#herramienta").addEventListener("change", e => mostrarHerramienta(e.target.value));
try {
  const guardada = localStorage.getItem("herramienta");
  if (guardada && [...$("#herramienta").options].some(o => o.value === guardada)) $("#herramienta").value = guardada;
} catch (e) {}
mostrarHerramienta($("#herramienta").value);

/** Prepara el proveedor elegido (Google con su clave, u OSM). Devuelve null si falta la clave. */
function prepararProveedor(avisar) {
  let prov = document.querySelector("input[name=prov]:checked").value === "google" ? Google : OSM;
  if (prov === Google && googleAgotado()) prov = pasarAOpenStreetMap();
  if (prov === Google && !usaProxy()) {
    Google.key = $("#apikey").value.trim();
    if (!Google.key) { avisar("Ingresa la API key de Google arriba, en «Servicio de búsqueda», o elige OpenStreetMap.", true); return null; }
    try { $("#remember").checked ? localStorage.setItem("geo_apikey", Google.key) : localStorage.removeItem("geo_apikey"); } catch (e) {}
  }
  return prov;
}

/* ============================== Validar rutero vs. base de PDV ============================== */
// Columnas por campo, en orden de preferencia (se comparan sin espacios, tildes ni mayúsculas)
const CAMPOS_RUTERO = [
  ["sap", "Código (SAP)", ["sap", "codigopdv", "codigo", "cod", "nit"]],
  ["nombre", "Nombre del PDV", ["pdv", "nombrepdv", "nombre", "establecimiento", "puntodeventa", "tienda"]],
  ["ciudad", "Ciudad", ["ciudad", "municipio"]],
  ["direccion", "Dirección", ["direccion", "dir"]],
  ["fecha", "Fecha de visita", ["fechavisita", "fechadevisita", "fecha", "fech", "dia"]],
  ["evento", "Evento", ["evento", "campana", "actividad"]],
  ["estado", "Estado de la visita", ["estado", "estadovisita", "estadodelavisita"]],
  // Ubicación que registra la persona en la visita: dos columnas, o una sola con "lat, lon"
  ["lat", "Latitud registrada en la visita", ["latitud", "lat", "latitudingreso", "latingreso", "latitudvisita",
    "latitudregistro", "latitudcheckin", "latitude", "geolat", "latitudreal"]],
  ["lon", "Longitud registrada en la visita", ["longitud", "longiutd", "lon", "lng", "long", "longitudingreso", "loningreso",
    "longitudvisita", "longitudregistro", "longitudcheckin", "longitude", "geolon", "longitudreal"]],
  ["coords", "Ubicación «lat, lon» (si viene en una sola columna)", ["ubicacion", "coordenadas", "geo", "gps",
    "ubicaciongps", "geolocalizacion", "ubicacioningreso", "location"]],
];
const CAMPOS_BASE = [
  ["sap", "Código (SAP)", ["sap", "codigopdv", "codigo", "cod", "nit"]],
  ["nombre", "Nombre del PDV", ["pdv", "nombrepdv", "nombre", "establecimiento", "puntodeventa", "tienda"]],
  ["ciudad", "Ciudad", ["ciudad", "municipio"]],
  ["direccion", "Dirección", ["direccion", "dir"]],
  ["lat", "Latitud", ["latitud", "lat", "latitude"]],
  ["lon", "Longitud", ["longitud", "longiutd", "lon", "lng", "long", "longitude"]],
  ["geook", "Geo validada (opcional)", ["geook", "geovalidada", "validado"]],
];
const ETIQUETA_V = {CORRESPONDE: "CORRESPONDE", REVISAR_V: "REVISAR", NO_CORRESPONDE: "NO CORRESPONDE",
  GEO_INVALIDA: "GEO INVÁLIDA EN BASE", SIN_GEO_BASE: "SIN GEO EN BASE", SIN_GEO_RUTERO: "SIN GEO EN RUTERO",
  NO_VERIFICABLE: "NO VERIFICABLE", NO_PROCESADO: "NO PROCESADO"};

/** Ubicación registrada en una visita del rutero, o null si no hay una coordenada válida en Colombia. */
function geoVisita(f, m) {
  let lat, lon;
  if (m.lat && m.lon && !vacio(f[m.lat]) && !vacio(f[m.lon])) {
    lat = parseFloat(String(f[m.lat]).replace(",", ".")); lon = parseFloat(String(f[m.lon]).replace(",", "."));
  } else if (m.coords && !vacio(f[m.coords])) {
    const nums = String(f[m.coords]).match(/-?\d{1,3}(?:[.,]\d+)?/g);
    if (!nums || nums.length < 2) return null;
    [lat, lon] = nums.slice(0, 2).map(n => parseFloat(n.replace(",", ".")));
  } else return null;
  if (isNaN(lat) || isNaN(lon) || !enColombia(lat, lon) || (Number.isInteger(lat) && Number.isInteger(lon))) return null;
  return [lat, lon];
}
const mediana = a => { const s = [...a].sort((x, y) => x - y), k = s.length >> 1; return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };
/** Ubicación típica del PDV según el rutero: mediana de las ubicaciones registradas y su dispersión. */
function resumenRutero(geos) {
  if (!geos || !geos.length) return null;
  const lat = mediana(geos.map(g => g[0])), lon = mediana(geos.map(g => g[1]));
  return {n: geos.length, lat, lon, dispersion: mediana(geos.map(g => distancia(lat, lon, g[0], g[1]))), geos};
}
const V = {rutero: null, base: null, pdvs: [], visitas: [], baseIdx: new Map(), res: new Map(), final: new Map(), detener: false,
  mapa: null, capa: null, sel: {evento: null, estado: null}};
const estadoV = (txt, error = false) => { const s = $("#vStatus"); s.textContent = txt; s.classList.toggle("err", error); };
const normSap = v => String(v ?? "").trim().replace(/\.0+$/, "");
const pad = n => String(n).padStart(2, "0");
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Fecha de visita como 'AAAA-MM-DD' desde texto ISO, dd/mm/aaaa o número de serie de Excel. */
function aFecha(v) {
  if (v instanceof Date) return ymd(v);
  if (typeof v === "number" && v > 20000 && v < 80000) { const d = XLSX.SSF.parse_date_code(v); return `${d.y}-${pad(d.m)}-${pad(d.d)}`; }
  const s = String(v ?? "").trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/.exec(s);
  return m ? `${m[3]}-${pad(m[2])}-${pad(m[1])}` : null;
}
const fmtFecha = f => f ? f.split("-").reverse().join("/") : "";

function detectarColumna(columnas, alternativas) {
  for (const alt of alternativas) { const c = columnas.find(c => clave(c) === alt); if (c) return c; }
  return "";
}
function pintarMapeoV(cont, campos, columnas, prefijo) {
  $(cont).innerHTML = campos.map(([k, etiqueta, alt]) => {
    const det = detectarColumna(columnas, alt);
    return `<div><label for="${prefijo}${k}">${etiqueta}</label><select id="${prefijo}${k}"><option value="">(no usar)</option>` +
      columnas.map(c => `<option${c === det ? " selected" : ""}>${escapar(c)}</option>`).join("") + "</select></div>";
  }).join("");
  $(cont).querySelectorAll("select").forEach(s => s.addEventListener("change", () => {
    if (prefijo === "r_") construirListas();
    revisarColumnasV(); recalcularV(); }));
}
const mapeoV = (campos, prefijo) => Object.fromEntries(campos.map(([k]) => [k, $("#" + prefijo + k)?.value || ""]));

function prepararDrop(drop, input, alCargar) {
  drop.addEventListener("click", () => input.click());
  drop.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") input.click(); });
  drop.addEventListener("dragover", e => { e.preventDefault(); drop.classList.add("over"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("over"));
  drop.addEventListener("drop", e => { e.preventDefault(); drop.classList.remove("over"); const f = e.dataTransfer.files[0]; if (f) f.arrayBuffer().then(b => alCargar(b, f.name)); });
  input.addEventListener("change", () => { const f = input.files[0]; if (f) f.arrayBuffer().then(b => alCargar(b, f.name)); });
}
function leerTabla(buf, nombre) {
  const wb = XLSX.read(buf, {type: "array"});
  const hoja = wb.SheetNames[0];
  const filas = XLSX.utils.sheet_to_json(wb.Sheets[hoja], {defval: "", raw: true});
  // Se guarda el libro original para reescribir la base celda por celda al descargarla actualizada
  return {nombre, hoja, filas, libro: wb, columnas: filas.length ? Object.keys(filas[0]) : []};
}
function cargarRutero(buf, nombre) {
  V.rutero = leerTabla(buf, nombre);
  $("#dropRutero").classList.add("cargado");
  $("#infoRutero").innerHTML = `<b>${escapar(nombre)}</b> · ${V.rutero.filas.length.toLocaleString("es-CO")} visitas · hoja ${escapar(V.rutero.hoja)}`;
  pintarMapeoV("#mapRutero", CAMPOS_RUTERO, V.rutero.columnas, "r_");
  if (!$("#fDesde").value) { const m = new Date(); m.setDate(m.getDate() + 1); $("#fDesde").value = ymd(m); }
  V.sel = {evento: null, estado: null};
  construirListas();
  mostrarPanelesV();
}
function cargarBase(buf, nombre) {
  V.base = leerTabla(buf, nombre);
  $("#dropBase").classList.add("cargado");
  $("#infoBase").innerHTML = `<b>${escapar(nombre)}</b> · ${V.base.filas.length.toLocaleString("es-CO")} puntos de venta · hoja ${escapar(V.base.hoja)}`;
  pintarMapeoV("#mapBase", CAMPOS_BASE, V.base.columnas, "b_");
  mostrarPanelesV();
}
function mostrarPanelesV() {
  $("#vCols").classList.remove("hidden");
  revisarColumnasV();
  if (V.rutero) $("#vFiltros").classList.remove("hidden");
  // Con solo la base ya se puede trabajar (modo «Sin Geo» o «Toda la base»)
  if (V.base) $("#vRun").classList.remove("hidden");
  if (V.base && !V.rutero && $("#vModo").value === "rutero") $("#vModo").value = "singeo";
  recalcularV();
}
prepararDrop($("#dropRutero"), $("#fileRutero"), cargarRutero);
prepararDrop($("#dropBase"), $("#fileBase"), cargarBase);

const esCancelada = v => /cancelad/i.test(sinAcentos(v));

/** Trae un reporte del servidor (el mismo proxy de "Descargar reporte") y lo carga como si se hubiera arrastrado. */
async function cargarDesdeServidor(nombre, alCargar, boton) {
  nombre = String(nombre || "").trim();
  const s = $("#srvStatus");
  if (!nombre) { s.textContent = "Escribe el nombre del reporte."; s.classList.add("err"); return; }
  boton.disabled = true; s.classList.remove("err");
  s.textContent = `Consultando "${nombre}" en el servidor…`;
  try {
    const r = await fetch(`${PROXY_URL}/api/export/${encodeURIComponent(nombre)}`);
    const datos = await r.json();
    if (!r.ok || !datos.file) throw new Error(datos.error || `Error ${r.status}`);
    s.textContent = `Descargando "${nombre}" (${Number(datos.rows).toLocaleString("es-CO")} filas)…`;
    const archivo = await fetch(datos.file);
    if (!archivo.ok) throw new Error(`No se pudo leer el archivo generado (HTTP ${archivo.status})`);
    alCargar(await archivo.arrayBuffer(), `${nombre}.xlsx`);
    s.textContent = `"${nombre}" cargado desde el servidor.`;
  } catch (e) {
    s.textContent = `No se pudo cargar "${nombre}": ${e.message}`; s.classList.add("err");
  } finally { boton.disabled = false; }
}
$("#srvRuteroBtn").addEventListener("click", e => cargarDesdeServidor($("#srvRutero").value, cargarRutero, e.currentTarget));
$("#srvBaseBtn").addEventListener("click", e => cargarDesdeServidor($("#srvBase").value, cargarBase, e.currentTarget));

/** Menú de eventos con el número de visitas dentro del rango de fechas (se conserva el evento elegido). */
function construirListas() {
  if (!V.rutero) return;
  const m = mapeoV(CAMPOS_RUTERO, "r_"), sel = $("#selEvento"), actual = sel.value;
  if (!m.evento) {
    sel.innerHTML = `<option value="">(el rutero no tiene columna de evento)</option>`;
    sel.disabled = true;
  } else {
    const desde = $("#fDesde").value, hasta = $("#fHasta").value, excluir = $("#excluirCanceladas").checked;
    const cuenta = new Map();
    for (const f of V.rutero.filas) {
      const fecha = aFecha(f[m.fecha]);
      if (m.fecha && (!fecha || (desde && fecha < desde) || (hasta && fecha > hasta))) continue;
      if (excluir && m.estado && esCancelada(String(f[m.estado] ?? ""))) continue;
      const v = String(f[m.evento] ?? "").trim() || "(vacío)";
      cuenta.set(v, (cuenta.get(v) || 0) + 1);
    }
    const valores = [...cuenta.entries()].sort((a, b) => b[1] - a[1]);
    const total = valores.reduce((s, [, n]) => s + n, 0);
    sel.disabled = false;
    sel.innerHTML = `<option value="">Todos los eventos (${total.toLocaleString("es-CO")} visitas)</option>` +
      valores.map(([v, n]) => `<option value="${escapar(v)}">${escapar(v)} (${n.toLocaleString("es-CO")})</option>`).join("");
    if (actual && cuenta.has(actual)) sel.value = actual;
  }
  aplicarSeleccion();
}
/** Traduce el menú de evento y la casilla de canceladas a los filtros que usa recalcularV. */
function aplicarSeleccion() {
  const m = mapeoV(CAMPOS_RUTERO, "r_"), evento = $("#selEvento").value;
  V.sel.evento = m.evento && evento ? new Set([evento]) : null;
  V.sel.estado = null;
  if (m.estado && $("#excluirCanceladas").checked) {
    const estados = new Set(V.rutero.filas.map(f => String(f[m.estado] ?? "").trim() || "(vacío)"));
    V.sel.estado = new Set([...estados].filter(e => !esCancelada(e)));
  }
}
$("#selEvento").addEventListener("change", () => { aplicarSeleccion(); recalcularV(); });
// Fechas y canceladas cambian los conteos del menú de eventos
["#fDesde", "#fHasta", "#excluirCanceladas"].forEach(s => $(s).addEventListener("change", () => { construirListas(); recalcularV(); }));

/** Las columnas se reconocen solas; el ajuste solo se abre (con aviso) si falta alguna necesaria. */
function revisarColumnas(aviso, detalle, faltantes) {
  $(aviso).textContent = faltantes.length ? `No se reconoció: ${faltantes.join(", ")}. Elígela${faltantes.length > 1 ? "s" : ""} abajo.` : "";
  if (faltantes.length) $(detalle).open = true;
}
function revisarColumnasV() {
  const faltan = [];
  if (V.rutero) {
    const m = mapeoV(CAMPOS_RUTERO, "r_");
    if (!m.sap) faltan.push("código (SAP) del rutero");
    if (!m.fecha) faltan.push("fecha de visita del rutero");
  }
  if (V.base) {
    const mb = mapeoV(CAMPOS_BASE, "b_");
    if (!mb.sap) faltan.push("código (SAP) de la base");
    if (!mb.lat || !mb.lon) faltan.push("latitud/longitud de la base");
  }
  revisarColumnas("#vColsAviso", "#vColsDetalle", faltan);
}


/** Geo de la base para un SAP: SI (válida), NO (vacía / "sin geo") o INVALIDA. */
function geoBase(filasBase, mb) {
  if (!filasBase || !filasBase.length) return {estado: "NO_EN_BASE", texto: ""};
  let primera = null;
  for (const f of filasBase) {
    const tLat = String(f[mb.lat] ?? "").trim(), tLon = String(f[mb.lon] ?? "").trim();
    const g = {fila: f, textoLat: tLat, textoLon: tLon, geoOk: mb.geook ? String(f[mb.geook] ?? "").trim() : ""};
    if (!tLat || !tLon || /sin\s*geo/i.test(tLat + tLon)) Object.assign(g, {estado: "NO"});
    else {
      const lat = parseFloat(tLat.replace(",", ".")), lon = parseFloat(tLon.replace(",", "."));
      Object.assign(g, !isNaN(lat) && !isNaN(lon) && enColombia(lat, lon) && !(Number.isInteger(lat) && Number.isInteger(lon))
        ? {estado: "SI", lat, lon} : {estado: "INVALIDA"});
    }
    if (g.estado === "SI") return {...g, duplicado: filasBase.length > 1};
    primera = primera || g;
  }
  return {...primera, duplicado: filasBase.length > 1};
}

function recalcularV() {
  if (!V.rutero && !V.base) return;
  const mb = V.base ? mapeoV(CAMPOS_BASE, "b_") : null;
  const m = V.rutero ? mapeoV(CAMPOS_RUTERO, "r_") : {};
  let enRango = 0, duplicadas = 0;
  const vistos = new Set(), visitas = [], pdvs = new Map();
  if (V.rutero) {
    const desde = $("#fDesde").value, hasta = $("#fHasta").value;
    const fechas = V.rutero.filas.map(f => aFecha(f[m.fecha])).filter(Boolean).sort();
    $("#rangoFechas").textContent = fechas.length ? `El rutero tiene visitas del ${fmtFecha(fechas[0])} al ${fmtFecha(fechas[fechas.length - 1])}.` +
      (m.fecha ? "" : " Selecciona la columna de fecha.") : "No se reconocieron fechas en la columna elegida.";
    for (const f of V.rutero.filas) {
      const fecha = aFecha(f[m.fecha]);
      if (m.fecha && (!fecha || (desde && fecha < desde) || (hasta && fecha > hasta))) continue;
      const ev = String(f[m.evento] ?? "").trim() || "(vacío)", es = String(f[m.estado] ?? "").trim() || "(vacío)";
      if (m.evento && V.sel.evento && !V.sel.evento.has(ev)) continue;
      if (m.estado && V.sel.estado && !V.sel.estado.has(es)) continue;
      enRango++;
      const sap = normSap(f[m.sap]);
      const k = `${sap}|${fecha}|${clave(ev)}`;
      if (vistos.has(k)) { duplicadas++; continue; }
      vistos.add(k);
      visitas.push(f);
      if (!sap) continue;
      const p = pdvs.get(sap) || {sap, nombre: f[m.nombre], ciudad: f[m.ciudad], direccion: f[m.direccion], eventos: new Set(), visitas: 0, primera: fecha, ultima: fecha, geos: []};
      p.eventos.add(ev); p.visitas++;
      const gv = geoVisita(f, m);
      if (gv) p.geos.push(gv);
      if (fecha && (!p.primera || fecha < p.primera)) p.primera = fecha;
      if (fecha && (!p.ultima || fecha > p.ultima)) p.ultima = fecha;
      pdvs.set(sap, p);
    }
  }
  V.visitas = visitas;
  V.baseIdx = new Map();
  if (V.base && mb.sap) V.base.filas.forEach(f => { const s = normSap(f[mb.sap]); if (s) V.baseIdx.set(s, [...(V.baseIdx.get(s) || []), f]); });
  V.pdvs = listaPdvs(pdvs, mb);
  const geos = V.base ? V.pdvs.map(p => geoBase(V.baseIdx.get(p.sap), mb)) : [];
  const c = e => geos.filter(g => g.estado === e).length;
  const conGeoRutero = V.pdvs.filter(p => p.geos.length).length;
  $("#vConteo").innerHTML = (V.rutero ? [
    ["Visitas con los filtros", enRango], ["Duplicadas eliminadas", duplicadas], ["Puntos de venta del rutero", pdvs.size],
    ["Con geo en el rutero", [...pdvs.values()].filter(p => p.geos.length).length],
  ] : []).map(([t, v]) => `<div class="card"><b>${v.toLocaleString("es-CO")}</b><span>${t}</span></div>`).join("");
  $("#vConteoBase").innerHTML = V.base ? [["Puntos de venta a procesar", V.pdvs.length], ["Con geo en la base", c("SI")],
    ["Sin geo en la base", c("NO")], ["Geo inválida en la base", c("INVALIDA")], ["No están en la base", c("NO_EN_BASE")]]
    .map(([t, v]) => `<div class="card"><b>${v.toLocaleString("es-CO")}</b><span>${t}</span></div>`).join("") : "";
  // El rutero no suele traer ubicación; si la trae, se usa como apoyo además del mapa
  $("#avisoGeoRutero").textContent = conGeoRutero
    ? `Además, ${conGeoRutero.toLocaleString("es-CO")} puntos de venta tienen ubicación registrada en el rutero; se usa como apoyo.` : "";
  actualizarEstimado();
}

/** Lista de PDV según el modo: los del rutero filtrado, los de la base que dicen «Sin Geo» o toda la base. */
function listaPdvs(pdvsRutero, mb) {
  const modo = $("#vModo").value;
  if (modo === "rutero" || !V.base) return [...pdvsRutero.values()];
  const lista = [];
  for (const [sap, filas] of V.baseIdx) {
    if (modo === "singeo" && geoBase(filas, mb).estado === "SI") continue;
    const f = filas[0];
    lista.push(pdvsRutero.get(sap) || {sap, nombre: f[mb.nombre], ciudad: f[mb.ciudad], direccion: f[mb.direccion],
      eventos: new Set(), visitas: 0, primera: null, ultima: null, geos: []});
  }
  return lista;
}

/** Cuántas consultas implica buscar en el mapa y si supera el cupo gratis de Google. */
function actualizarEstimado() {
  const n = $("#vPrueba").checked ? Math.min(5, V.pdvs.length) : V.pdvs.length;
  const usaMapa = true, google = document.querySelector("input[name=prov]:checked")?.value === "google";
  let txt = `${n.toLocaleString("es-CO")} puntos de venta a procesar.`;
  if (usaMapa && google) {
    txt += ` Con Google son unas ${(n * 7).toLocaleString("es-CO")} consultas.`;
    if (n * 4 > 5000) txt += " Es más que el uso gratuito de un mes: si se llega al límite, la búsqueda continúa sola con OpenStreetMap.";
  } else if (usaMapa) {
    const min = Math.max(1, Math.round(n * 6 / 60));
    txt += min >= 120 ? ` Con OpenStreetMap tarda unas ${Math.round(min / 60)} horas.` : ` Con OpenStreetMap tarda ${min === 1 ? "cerca de 1 minuto" : `unos ${min} minutos`}.`;
  }
  $("#vEstimado").textContent = txt;
}
["#vModo"].forEach(s => $(s).addEventListener("change", recalcularV));
$("#vPrueba").addEventListener("change", actualizarEstimado);
document.querySelectorAll("input[name=prov]").forEach(r => r.addEventListener("change", actualizarEstimado));

/** Compara la geo de la base con la ubicación encontrada en el mapa. */
function evaluarValidacion(p, g, enc, centro, tol) {
  const punto = enc && enc !== "OMITIDO" ? puntoDe(enc) : null;
  const o = {punto, ubic: enc === "OMITIDO" ? "NO BUSCADA" : ubicacionDe(enc), dist: null, dCentro: null, clase: "", motivo: "",
    direccionMapa: enc && enc !== "OMITIDO" && enc.estado !== "SIN_GEO" ? String(enc.direccion || "").toUpperCase() : "",
    // DIRECCION_COINCIDENTE = el mapa ubicó la dirección pero no identificó la tienda
    tipoMapa: enc && enc !== "OMITIDO" ? enc.tipo || "" : ""};
  if (g.estado === "SI" && punto) o.dist = distancia(g.lat, g.lon, punto[0], punto[1]);
  if (g.estado === "SI" && centro) o.dCentro = distancia(g.lat, g.lon, centro.lat, centro.lon);
  const m = d => d >= 1000 ? `${(d / 1000).toFixed(1)} km` : `${Math.round(d)} m`;
  if (g.estado === "NO_EN_BASE") { o.clase = "SIN_GEO_BASE"; o.motivo = "El punto de venta no está en la base." + (punto ? " Se sugiere la ubicación del mapa." : ""); }
  else if (g.estado === "INVALIDA") { o.clase = "GEO_INVALIDA"; o.motivo = `La geo de la base (${g.textoLat}, ${g.textoLon}) no es una coordenada válida en Colombia.` + (punto ? " Se sugiere la ubicación del mapa." : ""); }
  else if (g.estado === "NO") { o.clase = "SIN_GEO_BASE"; o.motivo = punto ? "La base no tiene geo; se sugiere la ubicación del mapa." : "La base no tiene geo y no se encontró el local en el mapa."; }
  else if (o.dCentro !== null && o.dCentro > 30000 && (!punto || o.dist > 5000)) {
    o.lejosCiudad = true;
    o.clase = "NO_CORRESPONDE"; o.motivo = `La geo de la base está a ${m(o.dCentro)} del centro de ${titulo(p.ciudad)}: no es la ciudad del local.`; }
  else if (enc === "OMITIDO") { o.omitido = true; o.clase = "NO_VERIFICABLE"; o.motivo = "Tiene GEO_OK en la base y se omitió la búsqueda; se conserva su geo."; }
  else if (!punto) { o.clase = "NO_VERIFICABLE"; o.motivo = "No se encontró el local en el mapa para comparar."; }
  else if (o.dist <= tol) { o.clase = "CORRESPONDE"; o.motivo = `La geo de la base está a ${m(o.dist)} del local` + (o.ubic === "VERIFICADA" ? "." : " (ubicación del mapa por confirmar)."); }
  else if (o.dist <= 1000 || o.ubic !== "VERIFICADA") { o.clase = "REVISAR_V"; o.motivo = `Diferencia de ${m(o.dist)} con el local` + (o.ubic !== "VERIFICADA" ? "; la ubicación del mapa también está por confirmar." : "."); }
  else { o.clase = "NO_CORRESPONDE"; o.motivo = `La geo de la base está a ${m(o.dist)} del local encontrado.`; }
  if (g.duplicado) o.motivo += " El código aparece repetido en la base.";
  if (g.estado === "SI") {
    const dec = t => (String(t).split(/[.,]/)[1] || "");
    if (dec(g.textoLat).length < 4 || dec(g.textoLon).length < 4) o.motivo += " La geo de la base tiene poca precisión (menos de 4 decimales).";
    else if (/(\d)\1{5,}/.test(dec(g.textoLat) + "|" + dec(g.textoLon))) o.motivo += " La geo de la base parece un valor aproximado (dígitos repetidos).";
  }
  return o;
}

$("#vStop").addEventListener("click", () => { V.detener = true; $("#vStop").disabled = true; });
$("#vRunBtn").addEventListener("click", validarPdvs);
const fmtDist = d => d >= 1000 ? `${(d / 1000).toFixed(1)} km` : `${Math.round(d)} m`;

/** Compara la geo de la base con la registrada en el rutero y, si se pidió, con la del mapa. */
function evaluarComparacion(p, g, rs, enc, centro, tol, usarMapa) {
  const o = usarMapa && enc ? evaluarValidacion(p, g, enc, centro, tol)
    : {punto: null, ubic: "", dist: null, dCentro: null, clase: "", motivo: "", direccionMapa: ""};
  o.rs = rs; o.distRutero = null; o.pctDentro = null; o.distMapa = o.dist;
  const sufijoMapa = o.motivo ? ` Mapa: ${o.motivo}` : "";
  if (g.estado !== "SI") {
    // Base sin geo (o inválida): se sugiere la del rutero si existe; si no, la del mapa
    if (rs) {
      o.clase = g.estado === "INVALIDA" ? "GEO_INVALIDA" : "SIN_GEO_BASE";
      o.motivo = (g.estado === "INVALIDA" ? `La geo de la base (${g.textoLat}, ${g.textoLon}) no es válida.`
        : g.estado === "NO_EN_BASE" ? "El punto de venta no está en la base." : "La base no tiene geo.") +
        ` Se sugiere la ubicación registrada en el rutero (mediana de ${rs.n} visita${rs.n > 1 ? "s" : ""}).`;
    } else if (!usarMapa) {
      o.clase = g.estado === "INVALIDA" ? "GEO_INVALIDA" : "SIN_GEO_BASE";
      o.motivo = g.estado === "NO_EN_BASE" ? "El punto de venta no está en la base y el rutero no registró ubicación." :
        "La base no tiene una geo válida y el rutero no registró ubicación.";
    }
    return o;
  }
  if (!rs) {
    if (!usarMapa) { o.clase = "SIN_GEO_RUTERO"; o.motivo = "Ninguna visita del rutero registró ubicación para comparar."; }
    return o;
  }
  // Base vs. rutero
  o.distRutero = distancia(g.lat, g.lon, rs.lat, rs.lon);
  o.pctDentro = rs.geos.filter(q => distancia(g.lat, g.lon, q[0], q[1]) <= tol).length / rs.n;
  const visitas = `${rs.n} visita${rs.n > 1 ? "s" : ""}`;
  if (o.distRutero <= tol) { o.clase = "CORRESPONDE"; o.motivo = `La ubicación del rutero (mediana de ${visitas}) está a ${fmtDist(o.distRutero)} de la base.`; }
  else if (o.distRutero <= 1000) { o.clase = "REVISAR_V"; o.motivo = `La ubicación del rutero (mediana de ${visitas}) está a ${fmtDist(o.distRutero)} de la base.`; }
  else { o.clase = "NO_CORRESPONDE"; o.motivo = `La ubicación del rutero (mediana de ${visitas}) está a ${fmtDist(o.distRutero)} de la base.`; }
  o.motivo += ` ${Math.round(o.pctDentro * 100)}% de las visitas se registró a menos de ${tol} m de la base.`;
  if (rs.n > 1 && rs.dispersion > 300) o.motivo += ` Las ubicaciones del rutero están dispersas (${fmtDist(rs.dispersion)} en promedio).`;
  // Desempate con el mapa: ¿cuál de las dos está en el local?
  if (o.punto && o.distRutero > tol) {
    const aBase = distancia(o.punto[0], o.punto[1], g.lat, g.lon), aRutero = distancia(o.punto[0], o.punto[1], rs.lat, rs.lon);
    if (aRutero <= 2 * tol && aBase > 2 * tol) { o.desempate = "rutero"; o.motivo += ` Según el mapa, la correcta es la del rutero (a ${fmtDist(aRutero)} del local).`; }
    else if (aBase <= 2 * tol && aRutero > 2 * tol) { o.desempate = "base"; o.motivo += ` Según el mapa, la correcta es la de la base (a ${fmtDist(aBase)} del local); las visitas se registraron lejos del local.`; }
    else o.motivo += sufijoMapa;
  }
  if (g.duplicado) o.motivo += " El código aparece repetido en la base.";
  return o;
}

async function validarPdvs() {
  if (!V.pdvs.length) { estadoV("No hay puntos de venta con los filtros elegidos.", true); return; }
  const usarMapa = true;   // la referencia es siempre el local encontrado en el mapa
  let prov = usarMapa ? prepararProveedor(estadoV) : null;
  if (usarMapa && !prov) return;
  const tol = Math.max(10, parseFloat(String($("#tolerancia").value).replace(",", ".")) || 150);
  const mb = mapeoV(CAMPOS_BASE, "b_");
  const lista = $("#vPrueba").checked ? V.pdvs.slice(0, 5) : V.pdvs;
  const omitirOk = $("#vOmitirOk").checked;
  V.detener = false; consultasReales = 0; V.res = new Map(); V.final = new Map(); V.tol = tol; V.usarMapa = usarMapa;
  $("#vRunBtn").disabled = true; $("#vStop").disabled = false; $("#vResults").classList.remove("hidden");
  estadoV("");
  for (let i = 0; i < lista.length && !V.detener; i++) {
    const p = lista[i];
    const g = geoBase(V.baseIdx.get(p.sap), mb), rs = resumenRutero(p.geos);
    const fb = g.fila || {};
    const datos = {id: p.sap, nombre: (mb.nombre && fb[mb.nombre]) || p.nombre, ciudad: (mb.ciudad && fb[mb.ciudad]) || p.ciudad,
      direccion: (mb.direccion && fb[mb.direccion]) || p.direccion, lat: "", lon: ""};
    $("#vProgress div").style.width = `${(i / lista.length) * 100}%`;
    estadoV(`Comparando ${i + 1} de ${lista.length}: ${datos.nombre}`);
    let enc = null, centro = null;
    try {
      if (usarMapa) {
        enc = omitirOk && g.estado === "SI" && /^ok$/i.test(g.geoOk) ? "OMITIDO" : await georreferenciar(datos, prov);
        centro = datos.ciudad ? await centroCiudad(prov, codigoMunicipio(datos.ciudad)) : null;
      }
      V.res.set(p.sap, {g, ...evaluarComparacion({...p, ...datos}, g, rs, enc, centro, tol, usarMapa)});
      V.final.set(p.sap, decisionPorDefecto(V.res.get(p.sap)));
    } catch (e) {
      // Límite gratis de Google: se repite este PDV con OpenStreetMap y se sigue con él
      if (e.limiteGoogle && prov === Google) { prov = pasarAOpenStreetMap(); i--; continue; }
      V.res.set(p.sap, {g, rs, clase: "NO_VERIFICABLE", motivo: `Falló la consulta: ${e.message}`, ubic: "ERROR", punto: null,
        dist: null, distMapa: null, distRutero: null, pctDentro: null, direccionMapa: "", error: true});
      // Si falló la consulta no se borra la geo que ya tenía la base
      V.final.set(p.sap, {fuente: g.estado === "SI" ? "base" : "singeo", pendiente: true});
      if (e.fatal) { estadoV(`El servicio rechazó la consulta: ${e.message}. Revisa la API key y que estén habilitadas Places API (New) y Geocoding API.`, true); break; }
    }
    // Sin mapa la comparación es inmediata: se repinta cada 50 PDV en vez de cada 3
    if (i % (usarMapa ? 3 : 50) === 0 || i === lista.length - 1) pintarV();
  }
  $("#vProgress div").style.width = "100%";
  $("#vRunBtn").disabled = false; $("#vStop").disabled = true;
  if (!$("#vStatus").classList.contains("err"))
    estadoV(`Listo: ${V.res.size} de ${V.pdvs.length} puntos de venta comparados${V.detener ? " (detenido)" : ""}.` +
      (usarMapa ? ` Consultas nuevas al servicio: ${consultasReales}.` : ""));
  pintarV();
}

function pintarV() {
  const cuenta = k => [...V.res.values()].filter(r => r.clase === k).length;
  $("#vCards").innerHTML = [["Puntos de venta", V.pdvs.length], ["Comparados", V.res.size], ["Corresponde", cuenta("CORRESPONDE")],
    ["Revisar", cuenta("REVISAR_V")], ["No corresponde", cuenta("NO_CORRESPONDE")], ["Sin geo en base", cuenta("SIN_GEO_BASE")],
    ["Sin geo en rutero", cuenta("SIN_GEO_RUTERO")], ["Geo inválida", cuenta("GEO_INVALIDA")], ["No verificable", cuenta("NO_VERIFICABLE")]]
    .map(([t, v]) => `<div class="card"><b>${v}</b><span>${t}</span></div>`).join("");
  const sel = $("#vFilter"), actual = sel.value;
  sel.innerHTML = `<option value="">Todos</option><option value="__pend"${actual === "__pend" ? " selected" : ""}>Sugerencias por confirmar</option>` +
    Object.entries(ETIQUETA_V).map(([k, e]) => `<option value="${k}"${k === actual ? " selected" : ""}>${e}</option>`).join("");
  const conMapa = [...V.res.values()].some(r => r.punto || r.ubic);
  const cab = ["SAP", "PDV", "Ciudad", "Visitas", "Geo base", "Geo rutero", "Base ↔ rutero",
    ...(conMapa ? ["Geo mapa", "Base ↔ mapa"] : []), "Validación", "Geo final (queda en la base)", "Motivo", "Ver"];
  const coord = (a, b) => `${a.toFixed(6)}, ${b.toFixed(6)}`;
  const enlace = (a, b, t) => `<a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${a},${b}">${t}</a>`;
  let html = "<thead><tr>" + cab.map(c => `<th>${c}</th>`).join("") + "</tr></thead><tbody>";
  for (const p of V.pdvs) {
    const r = V.res.get(p.sap), clase = r ? r.clase || "NO_VERIFICABLE" : "NO_PROCESADO";
    if (actual === "__pend" ? !(r && (V.final.get(p.sap) || decisionPorDefecto(r)).pendiente) : actual && clase !== actual) continue;
    const g = r?.g, rs = r?.rs ?? resumenRutero(p.geos);
    const gb = !g ? "" : g.estado === "SI" ? coord(g.lat, g.lon) : g.estado === "NO" ? "Sin geo" : g.estado === "NO_EN_BASE" ? "No está en la base" : `Inválida (${escapar(g.textoLat)})`;
    const gr = rs ? `${coord(rs.lat, rs.lon)}<br><small>${rs.n} visita${rs.n > 1 ? "s" : ""} con ubicación</small>` : "<small>Sin ubicación</small>";
    const gm = r?.punto ? `${coord(r.punto[0], r.punto[1])}<br><small>${escapar(r.ubic)}</small>` : r ? `<small>${escapar(r.ubic || "")}</small>` : "";
    const enlaces = [g?.estado === "SI" ? enlace(g.lat, g.lon, "Base") : "", rs ? enlace(rs.lat, rs.lon, "Rutero") : "",
      r?.punto ? enlace(r.punto[0], r.punto[1], "Mapa") : "",
      `<a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([p.nombre, p.direccion, p.ciudad, "Colombia"].filter(Boolean).join(", "))}">Buscar</a>`]
      .filter(Boolean).join(" · ");
    html += `<tr><td>${escapar(p.sap)}</td><td>${escapar(p.nombre)}</td><td>${escapar(p.ciudad)}</td><td>${p.visitas}</td>` +
      `<td>${gb}</td><td>${gr}</td><td>${r?.distRutero != null ? fmtDist(r.distRutero) : ""}</td>` +
      (conMapa ? `<td>${gm}</td><td>${r?.distMapa != null ? fmtDist(r.distMapa) : ""}</td>` : "") +
      `<td><span class="chip ${clase}">${ETIQUETA_V[clase]}</span></td><td class="final">${r ? celdaGeoFinal(p.sap, r) : ""}</td><td class="obs">${escapar(r?.motivo || "")}</td><td>${enlaces}</td></tr>`;
  }
  $("#vTable").innerHTML = html + "</tbody>";
  pintarFinal();
  pintarMapaV();
}
$("#vFilter").addEventListener("change", pintarV);

function pintarMapaV() {
  if (typeof L === "undefined") return;
  if (!V.mapa) {
    V.mapa = L.map("vMap").setView([4.6, -74.1], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom: 19, attribution: "© OpenStreetMap"}).addTo(V.mapa);
    V.capa = L.layerGroup().addTo(V.mapa);
  }
  V.capa.clearLayers();
  const css = getComputedStyle(document.body), col = v => css.getPropertyValue(v).trim();
  const puntos = [];
  for (const p of V.pdvs) {
    const r = V.res.get(p.sap);
    if (!r) continue;
    const info = `<b>${escapar(p.nombre)}</b><br>${escapar(ETIQUETA_V[r.clase] || "")}<br>${escapar(r.motivo || "")}`;
    const base = r.g?.estado === "SI" ? [r.g.lat, r.g.lon] : null, rut = r.rs ? [r.rs.lat, r.rs.lon] : null;
    if (base) { puntos.push(base); L.circleMarker(base, {radius: 6, color: col("--accent"), fillOpacity: .8, weight: 2}).bindPopup("Geo de la base<br>" + info).addTo(V.capa); }
    if (rut) { puntos.push(rut); L.circleMarker(rut, {radius: 6, color: col("--naranja"), fillOpacity: .8, weight: 2}).bindPopup("Ubicación del rutero<br>" + info).addTo(V.capa); }
    if (r.punto) { puntos.push(r.punto);
      L.circleMarker(r.punto, {radius: 6, color: col("--ok"), fillOpacity: r.ubic === "VERIFICADA" ? .85 : .2, weight: 2}).bindPopup("Ubicación en el mapa<br>" + info).addTo(V.capa); }
    const otro = rut || r.punto;
    if (base && otro && distancia(base[0], base[1], otro[0], otro[1]) > V.tol)
      L.polyline([base, otro], {color: col("--bad"), weight: 2, dashArray: "5 5"}).addTo(V.capa);
  }
  // Se encuadran los puntos dentro de Colombia (una geo errónea lejana no debe alejar todo el mapa)
  const enCo = puntos.filter(q => enColombia(q[0], q[1]));
  if (enCo.length) V.mapa.fitBounds(enCo, {padding: [30, 30], maxZoom: 15});
}

$("#vDownload").addEventListener("click", descargarV);
function descargarV() {
  if (!V.pdvs.length) { estadoV("No hay puntos de venta para descargar.", true); return; }
  const pend = V.pdvs.filter(p => !V.res.has(p.sap)).length;
  if (pend && !confirm(`Faltan ${pend} de ${V.pdvs.length} puntos de venta por comparar; saldrán como NO PROCESADO.\n\n¿Descargar de todas formas?`)) return;
  const mb = mapeoV(CAMPOS_BASE, "b_");
  const conMapa = [...V.res.values()].some(r => r.punto || r.ubic);
  const filasV = V.pdvs.map(p => {
    const r = V.res.get(p.sap), g = r?.g || geoBase(V.baseIdx.get(p.sap), mb), rs = r?.rs ?? resumenRutero(p.geos);
    const fila = {SAP: p.sap, PDV: p.nombre, CIUDAD: p.ciudad, DIRECCION: p.direccion, EVENTOS: [...p.eventos].join(", "), VISITAS: p.visitas,
      PRIMERA_VISITA: fmtFecha(p.primera), ULTIMA_VISITA: fmtFecha(p.ultima),
      GEO_BASE: {SI: "SI", NO: "NO", INVALIDA: "INVALIDA", NO_EN_BASE: "NO ESTA EN BASE"}[g.estado],
      LATITUD_BASE: g.estado === "SI" ? g.lat : g.textoLat || "", LONGITUD_BASE: g.estado === "SI" ? g.lon : g.textoLon || "",
      GEO_OK_BASE: g.geoOk || "",
      VISITAS_CON_GEO: rs ? rs.n : 0, LATITUD_RUTERO: rs ? +rs.lat.toFixed(7) : "", LONGITUD_RUTERO: rs ? +rs.lon.toFixed(7) : "",
      DIFERENCIA_BASE_RUTERO_M: r?.distRutero != null ? Math.round(r.distRutero) : "",
      PCT_VISITAS_DENTRO_TOLERANCIA: r?.pctDentro != null ? Math.round(r.pctDentro * 100) : ""};
    if (conMapa) Object.assign(fila, {LATITUD_MAPA: r?.punto ? r.punto[0] : "", LONGITUD_MAPA: r?.punto ? r.punto[1] : "",
      DIRECCION_MAPA: r?.direccionMapa || "", UBICACION_MAPA: r?.ubic || "",
      DIFERENCIA_BASE_MAPA_M: r?.distMapa != null ? Math.round(r.distMapa) : ""});
    const d = r ? V.final.get(p.sap) || decisionPorDefecto(r) : null, cf = r ? coordsFinal(r, d) : null;
    return Object.assign(fila, {VALIDACION: ETIQUETA_V[r ? r.clase || "NO_VERIFICABLE" : "NO_PROCESADO"],
      LATITUD_FINAL: cf ? +cf[0].toFixed(7) : r ? "Sin Geo" : "", LONGITUD_FINAL: cf ? +cf[1].toFixed(7) : r ? "Sin Geo" : "",
      GEO_FINAL_FUENTE: r ? (cf ? FUENTE_GEO[d.fuente] : "SIN GEO") + (d.pendiente ? " (por confirmar)" : d.editado ? " (a mano)" : "") : "",
      MOTIVO: r?.motivo || ""});
  });
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(filasV);
  ws["!cols"] = Object.keys(filasV[0]).map(k => ({wch: k === "MOTIVO" ? 80 : /PDV|DIRECCION|EVENTOS/.test(k) ? 36 : 14}));
  XLSX.utils.book_append_sheet(wb, ws, "Comparacion_PDV");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(V.visitas), "Rutero_filtrado");
  const c = k => filasV.filter(f => f.VALIDACION === ETIQUETA_V[k]).length;
  const resumen = [["Indicador", "Valor"], ["Fecha desde", fmtFecha($("#fDesde").value) || "(sin límite)"], ["Fecha hasta", fmtFecha($("#fHasta").value) || "(sin límite)"],
    ["Evento", V.sel.evento ? [...V.sel.evento].join(", ") : "Todos"],
    ["Visitas canceladas", $("#excluirCanceladas").checked ? "Excluidas" : "Incluidas"],
    ["Visitas (sin duplicados)", V.visitas.length], ["Puntos de venta únicos", V.pdvs.length],
    ["Con geo en la base", filasV.filter(f => f.GEO_BASE === "SI").length], ["Con geo en el rutero", filasV.filter(f => f.VISITAS_CON_GEO > 0).length],
    [], ["Resultado", ""], ...Object.keys(ETIQUETA_V).map(k => [ETIQUETA_V[k], c(k)]),
    [], ["Tolerancia (m)", V.tol || ""], ["Comparado también contra el mapa", conMapa ? "Sí" : "No"],
    ["Generado", new Date().toLocaleString("es-CO")]];
  const wres = XLSX.utils.aoa_to_sheet(resumen);
  wres["!cols"] = [{wch: 34}, {wch: 80}];
  XLSX.utils.book_append_sheet(wb, wres, "Resumen");
  // Nombre: base del rutero + fecha de inicio del filtro (o la primera visita incluida)
  const inicio = $("#fDesde").value || V.pdvs.map(p => p.primera).filter(Boolean).sort()[0] || ymd(new Date());
  const baseNombre = (V.rutero?.nombre || "rutero").replace(/\.[^.]+$/, "").replace(/[\\/:*?"<>|\s]+/g, "_");
  XLSX.writeFile(wb, `comparacion_${baseNombre}_${inicio}.xlsx`);
}

/* ---------- Geo final de cada PDV (la que queda en la base) ---------- */
const FUENTE_GEO = {base: "BASE", rutero: "RUTERO", mapa: "MAPA", manual: "MANUAL", singeo: "SIN GEO"};

/** Coordenadas disponibles para un PDV: la de la base, la del rutero y la del mapa. */
function fuentesGeo(r) {
  const f = {};
  if (r?.g?.estado === "SI") f.base = [r.g.lat, r.g.lon];
  if (r?.rs) f.rutero = [r.rs.lat, r.rs.lon];
  if (r?.punto) f.mapa = r.punto;
  return f;
}

/** Sugerencia de geo final según el resultado. "pendiente" marca las que conviene que alguien confirme. */
function decisionPorDefecto(r) {
  const f = fuentesGeo(r);
  switch (r.clase) {
    case "CORRESPONDE":
    case "SIN_GEO_RUTERO":
      return {fuente: f.base ? "base" : "singeo"};
    case "NO_VERIFICABLE":
      // El local no se encontró en el mapa: se conserva la geo que ya tenía la base; si no tenía, queda «Sin Geo»
      return {fuente: f.base ? "base" : "singeo"};
    case "SIN_GEO_BASE":
    case "GEO_INVALIDA":
      if (f.rutero) return {fuente: "rutero"};
      if (f.mapa && r.ubic === "VERIFICADA") return {fuente: "mapa"};
      return {fuente: "singeo", pendiente: Boolean(f.mapa)};   // hay un punto del mapa por confirmar
    case "REVISAR_V":
    case "NO_CORRESPONDE":
      if (r.desempate === "rutero" && f.rutero) return {fuente: "rutero"};
      if (r.desempate === "base") return {fuente: "base"};
      // La tienda quedó identificada en el mapa y la base no coincide: se corrige con la geo del mapa.
      // Si el mapa solo ubicó la dirección (no la tienda), no basta para reemplazar la geo de la base.
      if (!f.rutero && f.mapa && r.ubic === "VERIFICADA" && r.tipoMapa !== "DIRECCION_COINCIDENTE") return {fuente: "mapa"};
      if (r.clase === "NO_CORRESPONDE" && r.lejosCiudad && !f.rutero && !f.mapa) return {fuente: "singeo", pendiente: true};
      return {fuente: f.base ? "base" : "singeo", pendiente: true};
    default:
      return {fuente: f.base ? "base" : "singeo"};
  }
}

/** Coordenadas de la decisión, o null si queda «Sin Geo». */
function coordsFinal(r, d) {
  if (!d || d.fuente === "singeo") return null;
  if (d.fuente === "manual") return d.lat != null ? [d.lat, d.lon] : null;
  return fuentesGeo(r)[d.fuente] || null;
}

/** Lee "lat, lon" o un enlace de Google Maps / OpenStreetMap pegado por la persona. */
function leerCoordenadas(texto) {
  const t = String(texto || "").trim();
  const patrones = [/!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/, /[?&](?:q|query|ll|mlat)=(-?\d{1,2}\.\d+)(?:,|&mlon=)\s*(-?\d{1,3}\.\d+)/,
    /@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/, /#map=\d+\/(-?\d{1,2}\.\d+)\/(-?\d{1,3}\.\d+)/,
    /^\(?\s*(-?\d{1,2}[.,]\d+)\s*[,; ]\s*(-?\d{1,3}[.,]\d+)\s*\)?$/];
  for (const p of patrones) {
    const m = p.exec(t);
    if (m) {
      const lat = parseFloat(m[1].replace(",", ".")), lon = parseFloat(m[2].replace(",", "."));
      return enColombia(lat, lon) ? [lat, lon] : null;
    }
  }
  return null;
}

/** Celda editable de la tabla: qué geo queda en la base. */
function celdaGeoFinal(sap, r) {
  const d = V.final.get(sap) || decisionPorDefecto(r), f = fuentesGeo(r);
  const etiqueta = {base: "Base", rutero: "Rutero", mapa: "Mapa"};
  const opciones = Object.entries(f).map(([k, c]) => [k, `${etiqueta[k]} (${c[0].toFixed(5)}, ${c[1].toFixed(5)})`]);
  opciones.push(["manual", "Escribir coordenada…"], ["singeo", "Sin Geo"]);
  let html = `<select class="selFinal" data-sap="${escapar(sap)}">` +
    opciones.map(([k, t]) => `<option value="${k}"${k === d.fuente ? " selected" : ""}>${escapar(t)}</option>`).join("") + "</select>";
  if (d.fuente === "manual") {
    const valor = d.lat != null ? `${d.lat}, ${d.lon}` : (d.texto || "");
    html += `<input type="text" class="inManual${d.lat == null && d.texto ? " invalido" : ""}" data-sap="${escapar(sap)}" value="${escapar(valor)}"` +
      ` placeholder="4.6510, -74.0560 o enlace de Google Maps" style="margin-top:6px">`;
    if (d.lat == null && d.texto) html += `<small class="err">No es una coordenada válida en Colombia.</small>`;
  }
  if (d.pendiente) html += `<small class="pendiente">Sugerencia por confirmar</small>`;
  else if (d.editado) html += `<small>Elegido a mano</small>`;
  return html;
}

// La tabla se repinta completa al cambiar una decisión (sin esperar nuevas consultas)
$("#vTable").addEventListener("change", e => {
  const sap = e.target.dataset.sap;
  if (!sap) return;
  const r = V.res.get(sap), d = {...(V.final.get(sap) || decisionPorDefecto(r))};
  if (e.target.classList.contains("selFinal")) {
    Object.assign(d, {fuente: e.target.value, pendiente: false, editado: true});
    if (d.fuente !== "manual") { delete d.lat; delete d.lon; delete d.texto; }
  } else if (e.target.classList.contains("inManual")) {
    const c = leerCoordenadas(e.target.value);
    Object.assign(d, {fuente: "manual", pendiente: false, editado: true, texto: e.target.value, lat: c ? c[0] : null, lon: c ? c[1] : null});
  } else return;
  V.final.set(sap, d);
  pintarV();
});

/** Resumen de cómo queda la base con las decisiones actuales. */
function pintarFinal() {
  let conGeo = 0, sinGeo = 0, pendientes = 0, aMano = 0, cambian = 0;
  for (const [sap, r] of V.res) {
    const d = V.final.get(sap) || decisionPorDefecto(r), c = coordsFinal(r, d);
    c ? conGeo++ : sinGeo++;
    if (d.pendiente) pendientes++;
    if (d.editado) aMano++;
    if (d.fuente !== "base" && !(d.fuente === "singeo" && r.g?.estado !== "SI")) cambian++;
  }
  $("#vFinal").innerHTML = [["Quedan con geo", conGeo], ["Quedan «Sin Geo»", sinGeo], ["Cambian en la base", cambian],
    ["Sugerencias por confirmar", pendientes], ["Elegidos a mano", aMano]]
    .map(([t, v]) => `<div class="card"><b>${v.toLocaleString("es-CO")}</b><span>${t}</span></div>`).join("");
}

$("#vDownloadBase").addEventListener("click", descargarBaseV);
/** Descarga la base de PDV completa con la geo final en LATITUD/LONGITUD (tipos y formatos originales intactos). */
function descargarBaseV() {
  if (!V.base) { estadoV("Carga la base de puntos de venta.", true); return; }
  if (!V.res.size) { estadoV("Primero pulsa «Comparar puntos de venta».", true); return; }
  const invalidos = [...V.final.values()].filter(d => d.fuente === "manual" && d.lat == null).length;
  if (invalidos && !confirm(`${invalidos} coordenada(s) escritas a mano no son válidas y quedarán «Sin Geo».\n\n¿Descargar de todas formas?`)) return;
  const mb = mapeoV(CAMPOS_BASE, "b_");
  const ws = JSON.parse(JSON.stringify(V.base.libro.Sheets[V.base.hoja]));
  const rango = XLSX.utils.decode_range(ws["!ref"]);
  const cabecera = [];
  for (let c = rango.s.c; c <= rango.e.c; c++) { const celda = ws[XLSX.utils.encode_cell({r: rango.s.r, c})]; cabecera.push(celda ? String(celda.v) : ""); }
  const col = nombre => cabecera.indexOf(nombre) + rango.s.c;
  const cSap = col(mb.sap), cLat = col(mb.lat), cLon = col(mb.lon);
  const extra = [["GEO_FUENTE", "GEO_VALIDACION"]];
  for (let r = rango.s.r + 1; r <= rango.e.r; r++) {
    const sap = normSap(ws[XLSX.utils.encode_cell({r, c: cSap})]?.v);
    const res = V.res.get(sap);
    if (!res) { extra.push(["SIN PROCESAR", ""]); continue; }
    const d = V.final.get(sap) || decisionPorDefecto(res), c = coordsFinal(res, d);
    ws[XLSX.utils.encode_cell({r, c: cLat})] = c ? {t: "n", v: +c[0].toFixed(7)} : {t: "s", v: "Sin Geo"};
    ws[XLSX.utils.encode_cell({r, c: cLon})] = c ? {t: "n", v: +c[1].toFixed(7)} : {t: "s", v: "Sin Geo"};
    extra.push([c ? FUENTE_GEO[d.fuente] : "SIN GEO", ETIQUETA_V[res.clase] + (d.pendiente ? " (sugerencia sin confirmar)" : d.editado ? " (elegido a mano)" : "")]);
  }
  XLSX.utils.sheet_add_aoa(ws, extra, {origin: {r: rango.s.r, c: rango.e.c + 1}});
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, V.base.hoja.slice(0, 31));
  const baseNombre = (V.base.nombre || "base_pdv").replace(/\.[^.]+$/, "").replace(/[\\/:*?"<>|\s]+/g, "_");
  XLSX.writeFile(wb, `${baseNombre}_geo_${ymd(new Date())}.xlsx`);
}

// Para pruebas automatizadas: cargarLibro(arrayBuffer, nombre)
window.__geo = {cargarLibro, parsearDireccion, normalizada, analizarNombre, compararDireccion, parsearDireccionGoogle, ejecutar,
  resultados: () => resultados, cargarRutero, cargarBase, V, aFecha, evaluarValidacion, evaluarComparacion, resumenRutero, geoVisita, decisionPorDefecto, coordsFinal, leerCoordenadas};

