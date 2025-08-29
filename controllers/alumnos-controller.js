import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import AlumnosService from './../services/alumnos-service.js';

import multer from 'multer';
import fs from 'fs/promises';
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

// =========================
//   Multer en memoria
// =========================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype?.startsWith('image/')) {
      return cb(new Error('Solo se permiten archivos de imagenes.'), false);
    }
    cb(null, true);
  }
});

function sanitizeFilename(name = '') {
  const base = path.basename(name);
  return base.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function getExtFrom(file) {
  const extFromName = path.extname(file?.originalname || '').toLowerCase();
  if (extFromName) return extFromName;
  const map = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/heic': '.heic',
    'image/heif': '.heif'
  };
  return map[file?.mimetype] || '.jpg';
}

const ID_PAD_WIDTH = 6;
function padId(id, width = ID_PAD_WIDTH) {
  const num = Number(id);
  return Number.isInteger(num) && num >= 0 ? String(num).padStart(width, '0') : String(id).padStart(width, '0');
}

function nowTimestamp(d = new Date()) {
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const HH = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const SSS = String(d.getMilliseconds()).padStart(3, '0');
  return `${yyyy}${MM}${dd}${HH}${mm}${ss}${SSS}`;
}

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

    const ext = getExtFrom(req.file);
    const original = sanitizeFilename(req.file.originalname || `photo${ext}`);
    const paddedId = padId(id);
    const timestamp = nowTimestamp();
    const uniqueName = `${paddedId}-${timestamp}-${original}`;

    const dir = path.join(process.cwd(), 'uploads', 'alumnos');
    const finalPath = path.join(dir, uniqueName);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(finalPath, req.file.buffer);

    const publicUrl = `/static/alumnos/${uniqueName}`;
    alumno.imagen = publicUrl;

    const rowsAffected = await currentService.updateAsync(alumno);
    if (rowsAffected && rowsAffected !== 0) {
      return res.status(StatusCodes.CREATED).json({
        id,
        filename: uniqueName,
        url: publicUrl
      });
    } else {
      await fs.rm(finalPath, { force: true });
      return res.status(StatusCodes.NOT_FOUND).send(`No se pudo actualizar el alumno (id:${id}).`);
    }
  } catch (err) {
    console.error(err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Error al subir la imagen.');
  }
});

export default router;
