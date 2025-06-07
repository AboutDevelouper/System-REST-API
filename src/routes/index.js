const { Router } = require("express");
const router = Router();

const path = require("path")

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '../', 'public', 'home.html'));
});

router.get("/home", (req, res) => {
  res.redirect(`/`)
});

module.exports = router;
