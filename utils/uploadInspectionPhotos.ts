import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadInspectionPhotos(
  hiveId: string,
  inspectionId: string,
  photoUris: string[]
) {
  const uploadedUrls: string[] = [];

  for (const uri of photoUris) {
    if (uri.startsWith("http")) {
      uploadedUrls.push(uri);
      continue;
    }

    const response = await fetch(uri);
    const blob = await response.blob();

    const filename = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.jpg`;

    const imageRef = ref(
      storage,
      `hives/${hiveId}/inspections/${inspectionId}/${filename}`
    );

    await uploadBytes(imageRef, blob);

    const downloadUrl = await getDownloadURL(imageRef);

    uploadedUrls.push(downloadUrl);
  }

  return uploadedUrls;
}