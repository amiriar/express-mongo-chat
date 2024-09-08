import path from 'path';
import fs from 'fs';

export const isTrue = (value: any): boolean => ['true', 1, true].includes(value);
export const isFalse = (value: any): boolean => ['false', 0, false].includes(value);

export function deleteFileInPublic(fileAddress: string | undefined, date: string | undefined): void {
  if (fileAddress && date) {
    const [year, month, day] = date.split('/');

    const pathFile = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'public',
      'uploads',
      year,
      month,
      day,
      fileAddress
    );

    if (fs.existsSync(pathFile)) {
      fs.unlinkSync(pathFile);
      console.log(`File deleted: ${pathFile}`);
    } else {
      console.log(`File not found: ${pathFile}`);
    }
  } else {
    console.log('No file address or date provided.');
  }
}
