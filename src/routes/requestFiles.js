const { Router } = require("express");
const router = Router();

const fs = require("fs");
const path = require("path");
const mime = require('mime-types');

router.get("/request/imagens/:nameImage", async (req, res) => {
  const imagesDirectory = path.join(__dirname, '../', 'docs', 'static', 'image');
  const { nameImage } = req.params;

  const imagePath = path.join(imagesDirectory, nameImage);
  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('Imagem não encontrada:', err);
      return res.status(404).send('Imagem não encontrada');
    }

    const mimeType = mime.lookup(imagePath);
    res.setHeader('Content-Type', mimeType || 'application/octet-stream');
    res.sendFile(imagePath);
  });
});

router.get("/request/css/:fileName", async (req, res) => {
  const cssDirectory = path.join(__dirname, "../", "docs", "static", "css");
  const { fileName } = req.params;

  const cssPath = path.join(cssDirectory, fileName);
  fs.access(cssPath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).send("Arquivo CSS não encontrado");
    }

    res.setHeader("Content-Type", "text/css");
    res.sendFile(cssPath);
  });
});

router.get("/request/js/:fileName", async (req, res) => {
  const jsDirectory = path.join(__dirname, "../", "docs", "static", "scripts");
  const { fileName } = req.params;

  const jsPath = path.join(jsDirectory, fileName);
  fs.access(jsPath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).send("Arquivo JS não encontrado");
    }

    res.setHeader("Content-Type", "application/javascript");
    res.sendFile(jsPath);
  });
});

module.exports = router;
