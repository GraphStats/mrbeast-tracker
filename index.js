const fs = require("fs");
const path = require("path");
const axios = require("axios");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
const PORT = 6121;

const DATA_FILE = path.join(__dirname, "mrbeast-data.json");
const API_URL = "https://backend.mixerno.space/api/youtube/estv3/UCX6OQ3DkcsbYNE6H8uQQuVA";
const INTERVAL = 7000; // 2 secondes
const DAY_MS = 72 * 60 * 60 * 1000; // 72 heures

// Servir le dossier public
app.use(express.static(path.join(__dirname, "public")));

// Fonction pour lire le fichier JSON
function readData() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    const content = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Erreur lecture JSON:", err);
    return [];
  }
}

// Fonction pour écrire dans le fichier JSON
function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Erreur écriture JSON:", err);
  }
}

// Tracker MrBeast
async function trackMrBeast() {
  try {
    const res = await axios.get(API_URL);
    const now = Date.now();
    const data = readData();

    // Ajouter la nouvelle entrée avec timestamp
    data.push({
      timestamp: now,
      data: res.data
    });

    // Supprimer les entrées > 24h
    const filtered = data.filter(entry => now - entry.timestamp <= DAY_MS);

    writeData(filtered);
    console.log(`[${new Date().toLocaleTimeString()}] Données ajoutées, total: ${filtered.length}`);
  } catch (err) {
    console.error("Erreur API:", err.message);
  }
}

// Lancer le tracker toutes les 2 secondes
setInterval(trackMrBeast, INTERVAL);
trackMrBeast(); // ping immédiat

// Route Express pour récupérer le JSON
app.get("/data", (req, res) => {
  const data = readData();
  res.json(data);
});

// Route pour / → index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
