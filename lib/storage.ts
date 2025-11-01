/**
 * Vercel Blob Storage utilities
 * Simple file upload and management for user photos
 */

import { put, del, list } from "@vercel/blob";

/**
 * Upload a photo to Vercel Blob
 * @param file - The image file to upload
 * @param fid - Farcaster ID of the user
 * @param day - Day number (1-30) or 'early-bird'
 * @returns The public URL of the uploaded image
 */
export async function uploadPhoto(
  file: File,
  fid: string,
  day: number | "early-bird"
): Promise<string> {
  const filename = `movember/${fid}/day-${day}.jpg`;

  const blob = await put(filename, file, {
    access: "public",
    addRandomSuffix: false, // Use consistent filenames for easy overwrites
  });

  return blob.url;
}

/**
 * Upload a photo from a buffer (server-side)
 * @param buffer - The image buffer
 * @param fid - Farcaster ID of the user
 * @param day - Day number (1-30) or 'early-bird'
 * @returns The public URL of the uploaded image
 */
export async function uploadPhotoFromBuffer(
  buffer: Buffer,
  fid: string,
  day: number | "early-bird"
): Promise<string> {
  const filename = `movember/${fid}/day-${day}.jpg`;

  const blob = await put(filename, buffer, {
    access: "public",
    addRandomSuffix: false,
    contentType: "image/jpeg",
  });

  return blob.url;
}

/**
 * Delete a user's photo
 * @param url - The Blob URL to delete
 */
export async function deletePhoto(url: string): Promise<void> {
  await del(url);
}

/**
 * List all photos for a user
 * @param fid - Farcaster ID of the user
 * @returns Array of blob objects
 */
export async function listUserPhotos(fid: string) {
  const { blobs } = await list({
    prefix: `movember/${fid}/`,
  });

  return blobs;
}

/**
 * Delete all photos for a user (useful for testing)
 * @param fid - Farcaster ID of the user
 */
export async function deleteAllUserPhotos(fid: string): Promise<void> {
  const blobs = await listUserPhotos(fid);

  await Promise.all(blobs.map((blob) => del(blob.url)));
}
