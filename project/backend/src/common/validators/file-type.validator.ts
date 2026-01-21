import { FileValidator } from '@nestjs/common';
import * as path from 'path';

export class CustomFileExtensionValidator extends FileValidator<{
  allowedExtensions: string[];
}> {
  constructor(validationOptions: { allowedExtensions: string[] }) {
    super(validationOptions);
  }

  // Logic kiểm tra chính nằm ở đây
  isValid(file: Express.Multer.File): boolean {
    if (!file) return true; // Cho phép nếu file không bắt buộc

    // 1. Kiểm tra đuôi file (Extension)
    const fileExt = path.extname(file.originalname).toLowerCase();
    const isExtensionValid =
      this.validationOptions.allowedExtensions.includes(fileExt);

    // 2. Kiểm tra MIME type (Để chắc chắn hơn)
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const isMimeValid = allowedMimeTypes.includes(file.mimetype);

    return isExtensionValid && isMimeValid;
  }

  buildErrorMessage(file: any): string {
    return `File không hợp lệ. Chỉ chấp nhận các định dạng: ${this.validationOptions.allowedExtensions.join(', ')}`;
  }
}
