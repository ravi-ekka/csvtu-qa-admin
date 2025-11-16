export const cloudinaryDeleteImage = async (public_id: string) => {
  try {
    await fetch("/api/delete-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_id }),
    });
  } catch (err) {
    console.error("Error deleting image:", err);
  }
};