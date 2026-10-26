# Georreferenciación de PDV multimarca AU

Script: `georreferenciar_pdv.py` · Pruebas: `test_georreferenciar_pdv.py`

- **Entrada** (no se modifica): `PDV multimarca AU.xlsx`, hoja `Hoja4`. Ponlo en esta carpeta (`script_python/`), junto al script. Por ser datos del cliente, no se sube al repositorio. También puedes indicar otro archivo con `--entrada RUTA`.
- **Salida**: `PDV_multimarca_AU_georreferenciado.xlsx`, con las hojas `Hoja4` y `Resumen`.
- **Trabajo**: `georef_trabajo/`, que guarda la caché de consultas, el progreso por SAP y el log.

## Requisitos

Necesitas [uv](https://docs.astral.sh/uv/). El script declara sus dependencias (pandas, openpyxl y requests), así que uv las instala solo. Ejecuta los comandos dentro de esta carpeta.

Las pruebas que leen el Excel real se saltan solas si el archivo no está.

## Ejecución

```bash
uv run georreferenciar_pdv.py --diagnostico            # sin red: revisa coordenadas y direcciones
uv run georreferenciar_pdv.py --prueba                 # 5 registros -> ..._PRUEBA.xlsx
uv run georreferenciar_pdv.py                          # 38 registros -> archivo final
uv run georreferenciar_pdv.py --sap 10062348 10102410  # solo esos SAP
uv run --with pytest pytest -q test_georreferenciar_pdv.py
```

Otras opciones:

- `--proveedor osm|google|auto`: elige el servicio. Con `auto`, el script usa Google si existe `GOOGLE_MAPS_API_KEY` y, si no, OSM.
- `--reprocesar`: ignora el progreso guardado.
- `--no-actualizar-originales`: deja `LATITUD` y `LONGIUTD` como están.

Los registros ya procesados no se vuelven a consultar. Solo se reprocesan en tres casos: si cambian sus datos, si sube la versión del algoritmo o si terminaron en `ERROR`. Las respuestas del servicio quedan en caché.

## Corregir a mano los pendientes (`correcciones_manuales.xlsx`)

Cada ejecución completa crea o actualiza `correcciones_manuales.xlsx` con los registros que no se pudieron georreferenciar.

1. En la hoja `Correcciones`, abre el enlace **BUSCAR_EN_GOOGLE_MAPS**. Si existe, abre también **VER_CANDIDATO**, que es la ubicación propuesta por el script.
2. Localiza la sede, haz clic derecho sobre ella y copia las coordenadas. También sirve el enlace de *Compartir → Copiar enlace*.
3. Pega lo copiado en **ENLACE_O_COORDENADAS**. Opcionalmente llena **CIUDAD_CORRECTA**, **FUENTE** y **NOTA**.
4. Guarda el archivo y ejecuta `uv run georreferenciar_pdv.py`.

El script acepta las coordenadas solo si están en Colombia y dentro del municipio. En ese caso el registro pasa a `GEORREFERENCIADO` con tipo `VALIDACION_MANUAL`, y la observación indica la fuente y la distancia a la ubicación automática. Si la ubicación no es válida, el registro queda en `REVISAR` con el motivo.

Las correcciones se vuelven a aplicar en cada ejecución. Lo que ya escribiste en la plantilla se conserva al regenerarla.

## Mejoras de precisión automática

- **Interpolación de placa**: en `Calle 5 # 4-73`, el punto se ubica unos 73 m después de la Carrera 4, en dirección a la Carrera 5. Así el punto no queda en la esquina.
- **Búsqueda de la marca alrededor de la dirección y de centros comerciales**: sirve en ciudades con muchos locales de una misma cadena.
- **Cruces vecinos**: se prueban cuando la vía del cruce no llega en la cartografía.
- **Si el Excel de salida está abierto**, se guarda con fecha y hora en el nombre en lugar de fallar.

## Proveedores

**OpenStreetMap / Nominatim** (por defecto)

- Es gratuito. El script respeta la [política de uso](https://operations.osmfoundation.org/policies/nominatim/): hace como máximo 1 consulta por segundo, envía un User-Agent identificable, guarda las respuestas en caché y no hace consultas en masa.
- Variables opcionales: `NOMINATIM_USER_AGENT` y `NOMINATIM_EMAIL`.
- Los datos tienen licencia ODbL: cita "© OpenStreetMap contributors" si los publicas.

**Google** (opcional, con costo)

1. En Google Cloud, crea un proyecto y activa la facturación.
2. Habilita **Places API (New)** y **Geocoding API**.
3. Crea una API key y restríngela a esas dos APIs.
4. Configura la clave en la sesión y ejecuta:

```powershell
$env:GOOGLE_MAPS_API_KEY = "tu-clave"
uv run georreferenciar_pdv.py --proveedor google --prueba
```

Detalles del uso de Google:

- Solo se piden los campos `id`, `displayName`, `formattedAddress`, `location`, `types` y `addressComponents`. Corresponden al SKU *Text Search Pro*.
- Se estiman 2 o 3 solicitudes por PDV, unas 100 en total. Suelen quedar dentro del cupo gratuito mensual, pero revisa los precios vigentes en tu consola.
- La caché de Google expira a los 30 días, como exigen sus condiciones.
- Los límites municipales se siguen tomando de Nominatim.

## Estados

| Estado | Significado |
|---|---|
| `GEORREFERENCIADO` | Se identificó la sede (nombre + municipio + dirección compatible) o la placa/esquina exacta. Solo en estos casos se llenan `LATITUD_VALIDADA`/`LONGITUD_VALIDADA` y se actualizan `LATITUD`/`LONGIUTD`. |
| `REVISAR` | Hay varias sedes posibles, la dirección o el municipio no coinciden, o solo se encontró una ubicación aproximada (cruce de vías). El candidato aparece en `OBSERVACIONES`. |
| `SIN_RESULTADO` | No hubo ninguna coincidencia confiable. |
| `ERROR` | Falló el servicio después de 3 reintentos. Se vuelve a intentar en la siguiente ejecución. |

`TIPO_COINCIDENCIA` precisa el resultado:

- `SEDE_IDENTIFICADA_DIRECCION_COINCIDENTE`
- `SEDE_IDENTIFICADA`
- `DIRECCION_COINCIDENTE`
- `UBICACION_APROXIMADA`
- `DISCREPANCIA_DIRECCION`
