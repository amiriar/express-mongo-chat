import multer, { StorageEngine, FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import createError from 'http-errors';
import moment from 'jalali-moment';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

function createRoute(req: Request): string {
  const [year, month, day] = moment().format('jYYYY/jM/jD').split('/');
  // const jalaliDate = date.format('jYYYY/jM/jD');
  // const [year, month, day] = jalaliDate.split('/');

  const directory = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'sadraNext-main',
    'main-sadra-next',
    'public',
    'assets',
    'uploads',
    year,
    month,
    day
  );
  req.body.fileUploadPath = path.join('assets', 'uploads', year, month, day);
  fs.mkdirSync(directory, { recursive: true });
  return directory;
}

const storage: StorageEngine = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    if (file?.originalname) {
      const filePath = createRoute(req);
      return cb(null, filePath);
    }
    cb(new Error('Invalid file'), file.originalname);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    if (file.originalname) {
      const ext = path.extname(file.originalname);
      const fileName = uuidv4() + ext;
      req.body.filename = fileName;
      return cb(null, fileName);
    }
    cb(new Error('Invalid file'), file.originalname);
  }
});

function fileFilter(req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetypes = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  if (mimetypes.includes(ext)) {
    return cb(null, true);
  }
  return cb(createError.BadRequest('فرمت ارسال شده تصویر صحیح نمیباشد'));
}

function ResumeFilter(req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetypes = ['.pdf', '.docx', '.html', '.jpg', '.jpeg', '.png', '.webp', '.gif'];
  if (mimetypes.includes(ext)) {
    return cb(null, true);
  }
  return cb(createError.BadRequest('فرمت ارسال شده تصویر صحیح نمیباشد'));
}

function videoFilter(req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetypes = ['.mp4', '.mpg', '.mov', '.avi', '.mkv'];
  if (mimetypes.includes(ext)) {
    return cb(null, true);
  }
  return cb(createError.BadRequest('فرمت ارسال شده ویدیو صحیح نمیباشد'));
}

const pictureMaxSize = 10 * 1000 * 1000; // 10MB
const videoMaxSize = 50 * 1000 * 1000;   // 50MB

export const uploadFile = multer({ storage, fileFilter, limits: { fileSize: pictureMaxSize } });
export const uploadResume = multer({ storage, fileFilter: ResumeFilter, limits: { fileSize: pictureMaxSize } });
export const uploadVideo = multer({ storage, fileFilter: videoFilter, limits: { fileSize: videoMaxSize } });
