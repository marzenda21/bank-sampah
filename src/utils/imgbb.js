/**
 * Utility to compress and upload images to ImgBB API
 * API Key: 4c11967da90c376126d6c28829678f52
 */

/**
 * Compresses an image file/blob client-side using HTML5 Canvas
 * Reduces a 5MB-10MB photo down to ~150KB-300KB in milliseconds.
 */
export const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
  return new Promise((resolve) => {
    if (!file || typeof file === 'string') {
      return resolve(file);
    }

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
            resolve(blob || file);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

/**
 * Uploads file to ImgBB with automatic client-side compression
 */
export const uploadToImgBB = async (fileOrBase64) => {
  if (!fileOrBase64) return '';

  // If it's already an http/https URL, no need to re-upload
  if (typeof fileOrBase64 === 'string' && (fileOrBase64.startsWith('http://') || fileOrBase64.startsWith('https://'))) {
    return fileOrBase64;
  }

  const apiKey = '4c11967da90c376126d6c28829678f52';
  const formData = new FormData();

  try {
    let payload = fileOrBase64;

    // Compress File or Blob before uploading
    if (fileOrBase64 instanceof File || fileOrBase64 instanceof Blob) {
      payload = await compressImage(fileOrBase64);
    }

    if (typeof payload === 'string' && payload.startsWith('data:image')) {
      const base64Data = payload.replace(/^data:image\/[a-z]+;base64,/, '');
      formData.append('image', base64Data);
    } else {
      formData.append('image', payload);
    }

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.success && result.data) {
      return result.data.display_url || result.data.url;
    } else {
      console.error('ImgBB upload error response:', result);
      throw new Error(result.error?.message || 'Gagal mengunggah gambar ke ImgBB.');
    }
  } catch (error) {
    console.error('Error uploading to ImgBB:', error);
    throw error;
  }
};
