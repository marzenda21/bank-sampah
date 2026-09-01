/**
 * Utility to compress images client-side into lightweight Base64 data URLs
 * Shrinks 5MB-10MB photos down to ~50KB - 120KB for instant Firestore saving.
 */
export const compressImageToBase64 = (fileOrBase64, maxWidth = 1000, maxHeight = 1000, quality = 0.75) => {
  return new Promise((resolve) => {
    if (!fileOrBase64) return resolve('');

    // If it's an HTTP URL or already a small string, return as is
    if (typeof fileOrBase64 === 'string' && (fileOrBase64.startsWith('http://') || fileOrBase64.startsWith('https://'))) {
      return resolve(fileOrBase64);
    }

    const processDataUrl = (dataUrl) => {
      const img = new Image();
      img.src = dataUrl;
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

        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = () => resolve(dataUrl);
    };

    if (fileOrBase64 instanceof File || fileOrBase64 instanceof Blob) {
      const reader = new FileReader();
      reader.readAsDataURL(fileOrBase64);
      reader.onload = (event) => processDataUrl(event.target.result);
      reader.onerror = () => resolve('');
    } else if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:image')) {
      processDataUrl(fileOrBase64);
    } else {
      resolve(fileOrBase64);
    }
  });
};
