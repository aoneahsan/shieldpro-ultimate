// Global type definitions for browser APIs
declare global {
  interface HTMLDivElement {}
  interface HTMLInputElement {}
  interface File {}
  interface Blob {}
  interface URL {}
  const Blob: {
    new (blobParts?: BlobPart[], options?: BlobPropertyBag): Blob;
  };
  const URL: {
    createObjectURL(object: any): string;
    revokeObjectURL(url: string): void;
  };
}

export {};