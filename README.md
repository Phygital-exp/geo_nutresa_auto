# geo_nutresa_auto · Georreferenciación de PDV

Página estática publicada en GitHub Pages: **https://phygital-exp.github.io/geo_nutresa_auto/**

Todo lo de geo está en este repositorio:

- **La página**, en la raíz, publicada con GitHub Pages.
- **El script de Python** con el mismo motor de georreferenciación, en [`script_python/`](script_python/).

Arriba hay un menú **«¿Qué quieres hacer?»** con tres herramientas. Los reportes (`rutero_nutresa`, `pdv_nutresa`…) se piden al mismo proxy que usa la landing de [Phygital-exp/Automatizacion_Data_excel](https://github.com/Phygital-exp/Automatizacion_Data_excel) (rama `Proxy`, en Railway). Este repositorio no modifica ese proxy.

### 1. Descargar reporte

Escribe el nombre del reporte (por ejemplo `rutero_nutresa` o `pdv_nutresa`) y pulsa **Generar Excel**. La página pide el reporte al proxy y descarga el archivo.

- **Desde / Hasta** (opcionales): solo se descargan las filas de ese rango. La columna de fecha se detecta sola (`FECHA_VISITA`, `FECHA…`, luego `created`) y se puede cambiar después de generar el archivo.
- El archivo se llama **`<reporte>_<fecha de inicio>.xlsx`**, por ejemplo `rutero_nutresa_2026-10-27.xlsx`. Si no eliges fecha "Desde", se usa la primera fecha que trae el reporte.
- El filtro se aplica en el navegador sobre el archivo que genera el proxy, así que el proxy no cambia. Si el navegador no puede leer el archivo, se ofrece el enlace original con el reporte completo.

### 2. Georreferenciar archivo

Arrastras un Excel de puntos de venta y la página busca cada uno en el mapa (Google Maps con API key, u OpenStreetMap gratis). Valida cada ubicación con el nombre, la dirección y la ciudad, y devuelve el Excel con `LATITUD`/`LONGITUD`, `DIRECCION_MAPA` y `UBICACION` (`VERIFICADA` / `POR CONFIRMAR` / `NO ENCONTRADA` / `SIN GEO`).

### 3. Validar y corregir la geo de la base de PDV

Comprueba si la **latitud y longitud de la base de PDV** corresponden al local real y las corrige cuando no. Para cada PDV, la página busca el local **en el mapa** (Google u OpenStreetMap) por su nombre, dirección y ciudad, y mide la distancia contra la geo de la base.

1. Carga el rutero y la base: arrastra los Excel, o tráelos **directamente del servidor** por su nombre de reporte.
2. Filtra:
   - **fecha de visita** desde / hasta;
   - **evento**, en un menú con el número de visitas de cada uno;
   - **Excluir visitas canceladas**, activada por defecto.

   Las columnas se reconocen solas. El ajuste manual queda plegado y solo se abre, con un aviso, si falta alguna columna necesaria.
3. Se eliminan las visitas duplicadas (mismo SAP, fecha y evento).
4. Cada PDV se busca en el mapa y se mide la **distancia entre la geo de la base y el local encontrado**. La tolerancia es de 150 m por defecto.
   - `CORRESPONDE`: hasta la tolerancia.
   - `REVISAR`: hasta 1 km, o cuando el local del mapa quedó por confirmar.
   - `NO CORRESPONDE`: más de 1 km, o la geo de la base está fuera de la ciudad.
   - También pueden salir `SIN GEO EN BASE`, `GEO INVÁLIDA EN BASE` o `NO VERIFICABLE` (el local no se encontró en el mapa).
5. Se descarga `comparacion_<rutero>_<fecha de inicio>.xlsx` con tres hojas: `Comparacion_PDV`, `Rutero_filtrado` y `Resumen`.

Hoy el rutero no trae la ubicación de las visitas. Si algún día la trae (columnas `LATITUD`/`LONGITUD`, `LAT_INGRESO`… o `UBICACION` con «lat, lon»), se usa como apoyo: se toma la mediana de las ubicaciones registradas y se compara también con la base.

#### Completar y corregir la geo de la base

En **Puntos de venta a procesar** se elige el alcance:

- los PDV del rutero filtrado;
- todos los de la base que dicen «Sin Geo» (no necesita rutero);
- toda la base.

Con Google, la página estima las consultas. Si se acerca el límite gratis del mes, sigue sola con OpenStreetMap (ver «Límite para no generar cobros»).

En la tabla, la columna **Geo final** dice qué coordenada queda en la base para cada PDV. Viene una sugerencia, y se puede cambiar por la de la base, la del rutero, la del mapa, una escrita a mano (`lat, lon` o un enlace de Google Maps u OpenStreetMap) o «Sin Geo».

| Resultado | Sugerencia por defecto |
|---|---|
| `CORRESPONDE` | Se conserva la geo de la base. |
| `SIN GEO EN BASE` / `GEO INVÁLIDA` | La del mapa cuando el local quedó verificado; si no, «Sin Geo». |
| `REVISAR` / `NO CORRESPONDE` | **Se corrige con la geo del mapa** cuando el local quedó verificado. Si el mapa tiene dudas, se conserva la de la base, marcada **por confirmar**. |
| `NO VERIFICABLE` | Se conserva la geo que ya tenía la base; si no tenía, «Sin Geo». |

**Descargar base de PDV con la geo** genera `<base>_geo_<fecha>.xlsx`:

- la base completa, con las mismas columnas y formatos;
- `LATITUD`/`LONGITUD` con la geo final, o «Sin Geo»;
- dos columnas nuevas: `GEO_FUENTE` (`BASE`/`RUTERO`/`MAPA`/`MANUAL`/`SIN GEO`/`SIN PROCESAR`) y `GEO_VALIDACION`.

Los PDV que no se procesaron quedan como estaban.

Las columnas de ubicación del rutero se detectan solas: `LATITUD`/`LONGITUD`, `LAT_INGRESO`…, o una sola columna `UBICACION` con «lat, lon». Si tienen otro nombre, se eligen en «Columnas reconocidas automáticamente · ajustar».

### API key de Google

Cada usuario pega su clave en la página; no se guarda en el repositorio. Restringe la clave en Google Cloud:

- **Sitios web:** `https://phygital-exp.github.io/*` (y `http://localhost:*/*` para probar en tu equipo)
- **APIs:** Places API (New) y Geocoding API

#### Límite para no generar cobros

La página cuenta las consultas nuevas que hace a Google en el mes; lo que ya está en caché no cuenta. Antes de llegar al cupo gratis, se pasa sola a **OpenStreetMap** y muestra un aviso. No muestra cuánto falta. El corte es a las 4.500 búsquedas de lugares (de unas 5.000 gratis) y a las 9.000 geocodificaciones (de unas 10.000). También pasa a OpenStreetMap si Google responde que se agotó la cuota.

- El contador se reinicia cada mes, igual que el cupo de Google.
- Octubre de 2026 arranca con el uso que ya mostraba la consola de Google (`USO_INICIAL_GOOGLE` en `geo.js`).
- El conteo es **por navegador**: no ve las consultas hechas desde otros equipos ni desde scripts. Si varias personas usan la misma clave, pon además un límite diario en Google Cloud → Google Maps Platform → Cuotas.

### Archivos

| Archivo | Contenido |
|---|---|
| `index.html` | Estructura de la página y del menú «¿Qué quieres hacer?» |
| `style.css` | Estilos base (tomados de la landing de Phygital) |
| `geo.css` | Estilos de las pestañas de geo y del filtro de fechas |
| `script.js` | Descarga de reportes: proxy, filtro de fechas y nombre del archivo |
| `geo.js` | Georreferenciación, validación y corrección de la geo, límite de Google |
| `script_python/` | Script de Python con el mismo motor: georreferencia un Excel de PDV, con Google u OpenStreetMap ([guía](script_python/README.md)) |

### Probar en local

```bash
python -m http.server 8000
```

Luego abre `http://localhost:8000/`. El proxy de Railway acepta peticiones desde cualquier origen.

### Datos

Este repositorio es público, así que **no incluye datos**: ni los Excel de PDV, ni la caché de consultas, ni los resultados. La página trae los reportes del servidor o los toma del Excel que arrastres. El script de Python lee el Excel que pongas en su carpeta. El `.gitignore` evita que esos archivos se suban por error.
