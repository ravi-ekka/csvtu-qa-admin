export default function getPublicIdFromUrl(imageUrl:any) {
  try {
    // Remove query params if any
    const cleanUrl = imageUrl.split("?")[0];

    // Find the part after '/upload/'
    const parts = cleanUrl.split("/upload/");
    if (parts.length < 2) return null;

    // Remove version number (like v1691245678/)
    const path = parts[1].replace(/^v\d+\//, "");

    // Remove file extension (.jpg, .png, etc.)
    const publicId = path.substring(0, path.lastIndexOf(".")) || path;
    return publicId;
  } catch (err) {
    console.error("Error extracting public_id:", err);
    return null;
  }
}
