declare module 'multer' {
  export function diskStorage(options: any): any;
}

declare global {
  namespace Express {
    namespace Multer {
      interface File {
        originalname: string;
        filename: string;
        mimetype: string;
        size: number;
        path: string;
      }
    }
  }
}

export {};

