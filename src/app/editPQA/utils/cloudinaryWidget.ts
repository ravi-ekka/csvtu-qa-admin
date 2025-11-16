// // utils/cloudinaryWidget.ts
// export const openCloudinaryWidget = (callback: (url: string, public_id: string) => void) => {
//   // window.cloudinary is available after the Script loads
//   // @ts-ignore
//   const widget = (window as any).cloudinary.createUploadWidget(
//     {
//       cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
//       uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
//       sources: ["local", "camera", "url", "google_drive", "dropbox"],
//       multiple: false,
//       maxFiles: 1,
//       folder: "qa-images",
//       showPoweredBy: false,
//     },
//     (error: any, result: any) => {
//       if (!error && result && result.event === "success") {
//         callback(result.info.secure_url, result.info.public_id);
//       }
//     }
//   );
//   widget.open();
// };
