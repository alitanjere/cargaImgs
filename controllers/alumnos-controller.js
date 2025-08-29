import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import AlumnosService from './../services/alumnos-service.js';

import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = Router();
const currentService = new AlumnosService();

router.get('', async (req, res) => {
  console.log('AlumnosController.get');
  const returnArray = await currentService.getAllAsync();
  if (returnArray != null) {
    res.status(StatusCodes.OK).json(returnArray);
  } else {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Error interno.');
  }
});

router.get('/:id', async (req, res) => {
  const id = req.params.id;
  const returnEntity = await currentService.getByIdAsync(id);
  if (returnEntity != null) {
    res.status(StatusCodes.OK).json(returnEntity);
  } else {
    res.status(StatusCodes.NOT_FOUND).send(`No se encontro la entidad (id:${id}).`);
  }
});

router.post('', async (req, res) => {
  const entity = req.body;
  const newId = await currentService.createAsync(entity);
  if (newId > 0) {
    res.status(StatusCodes.CREATED).json(newId);
  } else {
    res.status(StatusCodes.BAD_REQUEST).json(null);
  }
});

router.put('/', async (req, res) => {
  const entity = req.body;
  const rowsAffected = await currentService.updateAsync(entity);
  if (rowsAffected !== 0) {
    res.status(StatusCodes.OK).json(rowsAffected);
  } else {
    res.status(StatusCodes.NOT_FOUND).send(`No se encontro la entidad (id:${entity.id}).`);
  }
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  const rowCount = await currentService.deleteByIdAsync(id);
  if (rowCount !== 0) {
    res.status(StatusCodes.OK).json(rowCount);
  } else {
    res.status(StatusCodes.NOT_FOUND).send(`No se encontro la entidad (id:${id}).`);
  }
});

// ---------- Multer con almacenamiento en disco ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const id = req.params.id;
    const dir = path.join(process.cwd(), 'uploads', 'alumnos', id);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'photo' + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype?.startsWith('image/')) {
      return cb(new Error('Solo se permiten archivos de imagenes.'), false);
    }
    cb(null, true);
  }
});

router.post('/:id/photo', upload.single('image'), async (req, res) => {
  const id = req.params.id;
  try {
    const alumno = await currentService.getByIdAsync(id);
    if (!alumno) {
      return res.status(StatusCodes.NOT_FOUND).send(`No se encontró el alumno (id:${id}).`);
    }

    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).send('No se recibió el archivo. Usa el campo "image".');
    }

    const publicUrl = `/static/alumnos/${id}/${req.file.filename}`;
    alumno.imagen = publicUrl;

    const rowsAffected = await currentService.updateAsync(alumno);
    if (rowsAffected && rowsAffected !== 0) {
      return res.status(StatusCodes.CREATED).json({
        id,
        filename: req.file.filename,
        url: publicUrl
      });
    } else {
      return res.status(StatusCodes.NOT_FOUND).send(`No se pudo actualizar el alumno (id:${id}).`);
    }
  } catch (err) {
    console.error(err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Error al subir la imagen.');
  }
});

export default router;
