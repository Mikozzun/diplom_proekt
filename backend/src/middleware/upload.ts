import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';

const UPLOAD_DIR = path.resolve('public', 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = crypto.randomUUID();
    cb(null, `${name}${ext}`);
  },
});

const ALLOWED_IMAGES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];
const ALLOWED_VIDEOS = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
];
const ALLOWED_TYPES = [...ALLOWED_IMAGES, ...ALLOWED_VIDEOS];

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

export const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  },
});

export const UPLOAD_PATH = UPLOAD_DIR;
export { ALLOWED_IMAGES, ALLOWED_VIDEOS };
