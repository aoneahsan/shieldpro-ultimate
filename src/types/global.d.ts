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

// Vite environment variables
interface ImportMetaEnv {
	readonly VITE_FIREBASE_API_KEY: string;
	readonly VITE_FIREBASE_AUTH_DOMAIN: string;
	readonly VITE_FIREBASE_PROJECT_ID: string;
	readonly VITE_FIREBASE_STORAGE_BUCKET: string;
	readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
	readonly VITE_FIREBASE_APP_ID: string;
	readonly VITE_FIREBASE_MEASUREMENT_ID: string;
	readonly VITE_USE_FIREBASE_EMULATOR: string;
	readonly DEV: boolean;
	readonly MODE: string;
	readonly BASE_URL: string;
	readonly PROD: boolean;
	readonly SSR: boolean;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

export {};
