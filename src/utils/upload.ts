import { api } from "../api/client";

type PresignResponse = {
  uploadUrl: string;
  readUrl: string;
  objectName: string;
};

export async function uploadImage(file: File, folder: string) {
  const { data } = await api.post("/storage/presign", {
    folder,
    filename: file.name,
    contentType: file.type
  });
  const presign = data.data as PresignResponse;
  const response = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file
  });
  if (!response.ok) {
    throw new Error("Upload failed");
  }
  return presign.readUrl;
}
