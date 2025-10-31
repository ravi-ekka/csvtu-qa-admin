export default async function cloudinaryUploadByUrl(imageUrl: any, paperInfo: any) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

  const formData = new FormData();
  formData.append("file", imageUrl); // URL of the image you want to upload
  formData.append("upload_preset", uploadPreset);
  formData.append("context", `caption=qa-image|alt=qa-image|authority=${paperInfo.authority}|field=${paperInfo.field}|course=${paperInfo.course}|season=${paperInfo.season}term=${paperInfo.term}|set=${paperInfo.set}|subject=${paperInfo.subject}|year=${paperInfo.year}|timestamp=${new Date().toISOString()}`);
  formData.append("tags",`${paperInfo.field},${paperInfo.course},${paperInfo.authority},${paperInfo.season},${paperInfo.term},${paperInfo.set},${paperInfo.subject},${paperInfo.year}`);
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error?.message || "Cloudinary upload failed");

    return data; // ✅ Return the Cloudinary URL
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
}

