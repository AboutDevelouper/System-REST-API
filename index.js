const fs = require("fs");
const path = require("path");
const express = require('express');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

const app = express();

process.on("uncaughtException", (err) => {
  console.error("[ERRO DETECTADO]: " + err.message);
  console.error("Stack Trace: " + err.stack);
});

process.on("unhandledRejection", (reason, promise) => {
  if (reason instanceof Error) {
    console.error("[ERRO DETECTADO]:", reason.message);
    console.error("Stack Trace: " + reason.stack);
  } else {
    console.error("[ERRO DETECTADO]:", reason);
  }
});

app.use(express.static(path.join(__dirname, 'src', 'public')));
app.use(express.json(path.join(__dirname, 'src', 'public', 'json')));
app.use(express.static(path.join(__dirname, 'src', 'public', 'css')));
app.use(express.static(path.join(__dirname, 'src', 'public', 'images')));
app.use(express.static(path.join(__dirname, 'src', 'public', 'scripts')));

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const routesDir = path.join(__dirname, "src", "routes");
const files = fs.readdirSync(routesDir);
for (const file of files) {
  if (!file.endsWith(".js")) continue
  const filePath = path.join(routesDir, file);
  const archive = require(filePath);
  app.use("/", archive);
};

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'src', 'public', '404.html'));
});

try {
  app.listen({
    host: "0.0.0.0",
    port: process.env.PORT ? Number(process.env.PORT) : 80,
  });
} finally {
  console.log(`"[API]" - Server running on port ${process.env.PORT ? Number(process.env.PORT) : 80}`);
};
