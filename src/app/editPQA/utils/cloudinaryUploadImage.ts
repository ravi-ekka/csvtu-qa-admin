// utils/cloudinary.ts
export type CloudinaryUploadResult = {
  url: string;
  public_id: string;
};
export const uploadToCloudinary = async (file: File): Promise<CloudinaryUploadResult> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    throw new Error(`Cloudinary upload failed: ${res.statusText}`);
  }
  const data = await res.json();
  if (!data.secure_url) {
    throw new Error("Invalid Cloudinary response");
  }
  return { url: data.secure_url, public_id: data.public_id };
};
