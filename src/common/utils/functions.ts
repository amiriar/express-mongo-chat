import path from 'path';
import fs from 'fs';

export const isTrue = (value: any): boolean =>
  ['true', 1, true].includes(value);
export const isFalse = (value: any): boolean =>
  ['false', 0, false].includes(value);

export function deleteFileInPublic(fileAddress: string | undefined): void {
  if (fileAddress) {
    if (fs.existsSync(fileAddress)) {
      fs.unlinkSync(fileAddress);
      console.log(`File deleted: ${fileAddress}`);
    } else {
      console.log(`File not found: ${fileAddress}`);
    }
  } else {
    console.log('No file address or date provided.');
  } 
}
