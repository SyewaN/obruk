const express = require("express");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(express.json());

const DATA_FILE = "data.json";

// Başlangıç verisi
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ history: [] }, null, 2));
}

// Ana endpoint
app.get("/", (req, res) => {
  res.send("Obruk backend çalışıyor 🚀");
});

// SON VERİ
app.get("/data/latest.json", (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE));
  const latest = data.history[data.history.length - 1];

  if (!latest) {
    return res.json({ status: "no data" });
  }

  res.json(latest);
});

// GEÇMİŞ VERİ
app.get("/data/history.json", (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE));
  res.json(data.history);
});

// VERİ AL
app.post("/data", (req, res) => {
  const newData = {
    ...req.body,
    timestamp: new Date()
  };

  const file = JSON.parse(fs.readFileSync(DATA_FILE));
  file.history.push(newData);

  fs.writeFileSync(DATA_FILE, JSON.stringify(file, null, 2));

  console.log("Kaydedildi:", newData);

  res.json({ message: "Veri kaydedildi" });
});

app.listen(PORT, () => {
  console.log(`Server çalışıyor: http://localhost:${PORT}`);
});

