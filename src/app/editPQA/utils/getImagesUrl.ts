export default function getImagesUrl(html: any) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const imageUrls = Array.from(tempDiv.querySelectorAll("img")).map(
        (img) => img.getAttribute("src") || ""
    );
    return imageUrls;
}