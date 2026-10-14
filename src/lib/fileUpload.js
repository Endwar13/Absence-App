import { validateFile } from './validator.js';

/**
 * File upload & image compression utilities
 * Supports Supabase Storage bucket path conventions:
 * - /attendance-selfies/{studentId}/{timestamp}.jpg
 * - /leave-request-proof/{studentId}/{timestamp}.{ext}
 */

export async function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
  if (!file || !file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

export async function uploadFileToStorage(file, bucketPath, options = {}) {
  const validation = validateFile(file, options);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  let fileToUpload = file;
  if (file.type.startsWith('image/')) {
    fileToUpload = await compressImage(file);
  }

  // Convert to object URL or persistent base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(fileToUpload);
    reader.onload = () => {
      const dataUrl = reader.result;
      resolve({
        url: dataUrl,
        path: bucketPath,
        name: file.name,
        size: `${(fileToUpload.size / (1024 * 1024)).toFixed(1)} MB`
      });
    };
    reader.onerror = (err) => reject(new Error('Gagal membaca file: ' + err.message));
  });
}
