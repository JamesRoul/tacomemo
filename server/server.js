import express from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import fetch from 'node-fetch'; // Importation comme module ES

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
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

const ZELTY_API_KEY = 'MTE0ODQ6RF/sWrd3fnkRzxlXrdKe4rANWwU=';

app.get('/api/catalogue', async (req, res) => {
  const apiUrl = 'https://api.zelty.fr/2.7/catalog/tags';
  try {
    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ZELTY_API_KEY}`
      }
    });

    if (!apiResponse.ok) {
      throw new Error(`Erreur API: ${apiResponse.statusText}`);
    }

    const data = await apiResponse.json();
    res.json(data);
  } catch (error) {
    console.error('Erreur lors de la communication avec l\'API Zelty :', error);
    res.status(500).send('Erreur interne du serveur');
  }
});

app.get('/api/get-tags', async (req, res) => {
  const lang = req.query.lang || 'fr'; // Défaut à 'fr' si non spécifié
  const showAll = req.query.show_all === '1'; // Convertit le paramètre en booléen

  try {
    const apiUrl = `https://api.zelty.fr/2.7/catalog/tags?lang=${lang}${showAll ? '&show_all=1' : ''}`;
    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ZELTY_API_KEY}`
      }
    });

    if (!apiResponse.ok) {
      throw new Error(`Erreur API: ${apiResponse.statusText}`);
    }

    const data = await apiResponse.json();
    res.json(data); // Envoie les données récupérées au client
  } catch (error) {
    console.error('Erreur lors de la récupération des tags :', error);
    res.status(500).send('Erreur interne du serveur');
  }
});
app.get('/catalog/dishes', async (req, res) => {
  const { show_all, all_restaurants, lang, limit, offset } = req.query; // Desestructuración de parámetros GET

  // Construye la URL con los parámetros opcionales
  let apiUrl = 'https://api.zelty.fr/2.7/catalog/dishes';
  const queryParams = new URLSearchParams({
      ...(show_all ? { 'show_all': show_all } : {}),
      ...(all_restaurants ? { 'all_restaurants': all_restaurants } : {}),
      ...(lang ? { 'lang': lang } : {}),
      ...(limit ? { 'limit': limit } : {}),
      ...(offset ? { 'offset': offset } : {})
  }).toString();

  if (queryParams) {
      apiUrl += `?${queryParams}`;
  }

  try {
      const apiResponse = await fetch(apiUrl, {
          method: 'GET',
          headers: {
              'Authorization': `Bearer ${ZELTY_API_KEY}` // Asegúrate de tener tu API Key correctamente configurada aquí
          }
      });

      if (!apiResponse.ok) {
          throw new Error(`Error de la API: ${apiResponse.statusText}`);
      }

      const data = await apiResponse.json();
      res.json(data); // Envía los datos de los platos al cliente
  } catch (error) {
      console.error('Error al comunicarse con la API de Zelty:', error);
      res.status(500).send('Error interno del servidor');
  }
});
app.get('/catalog/menus', async (req, res) => {
  const { show_all, all_restaurants } = req.query; // Desestructuración de parámetros GET

  // Construye la URL con los parámetros opcionales
  let apiUrl = 'https://api.zelty.fr/2.7/catalog/menus';
  const queryParams = new URLSearchParams({
    ...(show_all ? { 'show_all': show_all } : {}),
    ...(all_restaurants ? { 'all_restaurants': all_restaurants } : {}),
  }).toString();

  if (queryParams) {
    apiUrl += `?${queryParams}`;
  }

  try {
    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ZELTY_API_KEY}` // Asegúrate de tener tu API Key correctamente configurada aquí
      }
    });

    if (!apiResponse.ok) {
      throw new Error(`Error de la API: ${apiResponse.statusText}`);
    }

    const data = await apiResponse.json();
    res.json(data); // Envía los datos de los menús al cliente
  } catch (error) {
    console.error('Error al comunicarse con la API de Zelty:', error);
    res.status(500).send('Error interno del servidor');
  }
});


app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});