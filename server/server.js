const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Ici, on s'assure que le dossier de destination existe
const uploadDirectory = path.join(__dirname, 'public', 'uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });

// Configuration pour servir les fichiers statiques
app.use('/uploads', express.static(uploadDirectory));

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDirectory);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });
const dbPath = './carousel_images.db';

// Création de la table si elle n'existe pas
const db = new sqlite3.Database(dbPath, err => {
  if (err) {
    console.error('Erreur à l\'ouverture de la base de données', err.message);
  } else {
    console.log('Connexion réussie à la base de données');
    db.run('CREATE TABLE IF NOT EXISTS carousel_images (id INTEGER PRIMARY KEY, image_path TEXT)');
  }
});

// Obtener todas las imágenes del carrusel
app.get('/carousel-images', (req, res) => {
  db.all('SELECT * FROM carousel_images', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Agregar una imagen al carrusel
app.post('/add-carousel-image', upload.single('image'), (req, res) => {
  const imagePath = req.file ? req.file.path : null;
  if (!imagePath) {
    res.status(400).json({ error: 'No se ha proporcionado una imagen.' });
    return;
  }

  db.run('INSERT INTO carousel_images (image_path) VALUES (?)', [imagePath], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, imagePath: imagePath });
  });
});

// Eliminar una imagen del carrusel
app.delete('/delete-carousel-image/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM carousel_images WHERE id = ?', id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'No se encontró ninguna imagen con ese ID.' });
      return;
    }
    res.json({ message: 'Imagen eliminada correctamente.' });
  });
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});