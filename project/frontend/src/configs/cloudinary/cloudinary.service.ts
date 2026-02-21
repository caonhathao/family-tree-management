import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
export const uploadFile = async (
  file: File,
  folderName: string,
): Promise<UploadApiResponse> => {
  if (!file) throw new Error("FILE_MISSING");

  // Chuyển File object sang Buffer để stream lên Cloudinary
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folderName },
      (error, result) => {
        if (error) return reject(new Error("UPLOAD_FAILED"));
        if (result) resolve(result);
      },
    );

    // Ghi buffer vào stream
    uploadStream.end(buffer);
  });
};

export const destroyFile = async (
  url: string | undefined,
  folderName: string,
): Promise<{ result: string }> => {
  if (!url || url.length === 0) throw new Error("URL_MISSING");

  const publicId = getPublicId(url);
  // Đảm bảo path chuẩn: folder/public_id
  const fullPath = `${folderName}/${publicId}`;

  return await cloudinary.uploader.destroy(fullPath);
};

const getPublicId = (url: string): string => {
  const parts = url.split("/");
  const fileName = parts.pop() || "";
  return fileName.split(".")[0];
};
