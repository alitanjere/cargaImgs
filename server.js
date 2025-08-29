import express from 'express';
import path from 'path';
import alumnosRouter from './controllers/alumnos-controller.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

app.use('/static', express.static(path.join(__dirname, 'uploads')));
app.use('/alumnos', alumnosRouter);

app.get('/', (req, res) => {
  res.send('API running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
