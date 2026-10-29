const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const app = express();

const PORT = process.env.PORT || 3000;
// La API key de Google va solo en la variable de entorno del servidor (Railway), nunca en el código
const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;
const CAMPOS_PLACES = "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.addressComponents";

// Solo las páginas de georreferenciación pueden usar el proxy desde el navegador
const ORIGENES = ["https://suntzz.github.io", "https://phygital-exp.github.io", /^http:\/\/localhost(:\d+)?$/];
app.use(cors({ origin: ORIGENES }));
app.use("/api", (req, res, next) => {
    const origen = req.get("Origin");
    if (origen && !ORIGENES.some(o => (o instanceof RegExp ? o.test(origen) : o === origen))) {
        return res.status(403).json({ error: "Origen no permitido" });
    }
    next();
});
app.use(express.json());

async function reenviar(res, url, opciones) {
    if (!GOOGLE_KEY) return res.status(500).json({ error: "Falta la variable de entorno GOOGLE_MAPS_API_KEY" });
    try {
        const response = await fetch(url, opciones);
        const data = await response.json();
        if (!response.ok) console.error(`❌ Error HTTP ${response.status}:`, JSON.stringify(data).substring(0, 200));
        res.status(response.status).json(data);
    } catch (err) {
        console.error("❌ Error en el proxy:", err);
        res.status(500).json({ error: "Error al consultar Google", details: err.message });
    }
}

// Places API (New) - Text Search
app.post("/api/places", (req, res) => reenviar(res, "https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": GOOGLE_KEY, "X-Goog-FieldMask": CAMPOS_PLACES },
    body: JSON.stringify(req.body),
}));

// Geocoding API
app.get("/api/geocode", (req, res) => {
    const params = new URLSearchParams(req.query);
    params.set("key", GOOGLE_KEY || "");
    reenviar(res, `https://maps.googleapis.com/maps/api/geocode/json?${params}`);
});

app.get("/", (req, res) => res.json({ ok: true, servicio: "geo-proxy" }));

app.listen(PORT, () => {
    console.log(`Servidor proxy escuchando en http://localhost:${PORT}`);
});
