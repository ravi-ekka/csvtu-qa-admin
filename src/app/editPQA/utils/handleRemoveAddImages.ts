import { cloudinaryDeleteImage } from "./cloudinaryDeleteImage";
import cloudinaryUploadByUrl from "./cloudinaryUploadByUrl";
import getPublicIdFromUrl from "./getPublicIdFromUrl";

export default async function handleRemoveAddImages(p_urls: string[], c_urls: string[],paperInfo:any) {
  // Find removed and added images
  const removed = p_urls.filter(x => !c_urls.includes(x));
  const added = c_urls.filter(x => !p_urls.includes(x));

  console.log("Removed images:", removed);
  console.log("Added images:", added);

  // Delete removed images from Cloudinary
  const deletePromises = removed.map(async (url) => {
    try {
      const publicId = getPublicIdFromUrl(url);
      const res = await cloudinaryDeleteImage(publicId);
      return {urls: url,res:res};
    } catch (err) {
      console.error("Failed to delete:", url, err);
    }
  });

  // Upload newly added images
  const uploadPromises = added.map(async (url) => {
    try {
      const res = await cloudinaryUploadByUrl(url,paperInfo);
      return { oldUrl: url, newUrl: res.secure_url };
    } catch (err) {
      console.error("Failed to upload:", url, err);
    }
  });

  // Wait for all operations to finish
  const [deletedResults, uploadedResults] = await Promise.all([
    Promise.all(deletePromises),
    Promise.all(uploadPromises),
  ]);

  return { deletedResults, uploadedResults};
}
