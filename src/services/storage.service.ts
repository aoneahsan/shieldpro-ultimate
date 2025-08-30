import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../utils/firebase';

class StorageService {
  private static instance: StorageService;

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Upload profile image
   */
  async uploadProfileImage(userId: string, file: File): Promise<string> {
    try {
      // Validate file
      if (!this.isValidImageFile(file)) {
        throw new Error('Invalid image file. Please upload a JPG, PNG, or WebP image under 5MB.');
      }

      // Compress image if needed
      const processedFile = await this.processImage(file);

      // Create storage reference
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `profiles/${userId}/${fileName}`);

      // Upload file
      const snapshot = await uploadBytes(storageRef, processedFile);

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Clean up old profile images
      await this.cleanupOldProfileImages(userId, fileName);

      return downloadURL;
    } catch {
      console.error('Failed to upload profile image:', error);
      throw error;
    }
  }

  /**
   * Delete profile image
   */
  async deleteProfileImage(photoURL: string): Promise<void> {
    try {
      // Extract path from URL
      const path = this.extractPathFromURL(photoURL);
      if (!path) return;

      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch {
      console.error('Failed to delete profile image:', error);
      // Don't throw - image might already be deleted
    }
  }

  /**
   * Validate image file
   */
  private isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    return validTypes.includes(file.type) && file.size <= maxSize;
  }

  /**
   * Process and compress image if needed
   */
  private async processImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Set maximum dimensions
          const maxWidth = 500;
          const maxHeight = 500;
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw and compress image
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to process image'));
              }
            },
            'image/jpeg',
            0.85 // 85% quality
          );
        };

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        img.src = e.target?.result as string;
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Clean up old profile images
   */
  private async cleanupOldProfileImages(userId: string, currentFileName: string): Promise<void> {
    // This would require listing files which isn't directly supported in Firebase Storage
    // from the client side. You'd typically handle this with a Cloud Function
    // For now, we'll just keep the current implementation simple
  }

  /**
   * Extract storage path from download URL
   */
  private extractPathFromURL(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/o\/(.+?)\?/);
      return pathMatch ? decodeURIComponent(pathMatch[1]) : null;
    } catch {
      return null;
    }
  }
}

export const uploadProfileImage = (userId: string, file: File) =>
  StorageService.getInstance().uploadProfileImage(userId, file);

export const deleteProfileImage = (photoURL: string) =>
  StorageService.getInstance().deleteProfileImage(photoURL);

export default StorageService;
