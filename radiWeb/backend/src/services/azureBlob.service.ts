import { getBlobServiceClient, generateSasUrl } from '../config/azure.config';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export interface BlobUploadResult {
  blobName: string;
  blobUrl: string;
  sasUrl: string | null;
}

/**
 * Sube un archivo a Azure Blob Storage.
 * En modo desarrollo sin credenciales, simula la subida guardándolo localmente.
 */
export async function uploadBlob(
  containerName: string,
  file: Express.Multer.File,
  prefix?: string
): Promise<BlobUploadResult> {
  const client = getBlobServiceClient();
  const blobName = `${prefix ?? ''}${uuidv4()}_${file.originalname}`;

  // Modo mock: sin Azure configurado
  if (!client) {
    logger.warn('⚠️  Usando almacenamiento mock – Azure no configurado');
    const mockDir = path.join(process.cwd(), 'mock-storage', containerName);
    if (!fs.existsSync(mockDir)) fs.mkdirSync(mockDir, { recursive: true });
    
    // Si hay prefijo como 'study-1/', crear subcarpeta
    const targetDir = prefix ? path.join(mockDir, prefix) : mockDir;
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    
    const fileName = `${uuidv4()}_${file.originalname}`;
    fs.writeFileSync(path.join(targetDir, fileName), file.buffer);
    
    const mockUrl = `http://localhost:3000/mock-storage/${containerName}/${prefix ?? ''}${fileName}`;
    return { blobName: `${prefix ?? ''}${fileName}`, blobUrl: mockUrl, sasUrl: mockUrl };
  }

  const containerClient = client.getContainerClient(containerName);
  await containerClient.createIfNotExists();

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: { blobContentType: file.mimetype },
  });

  const blobUrl = blockBlobClient.url;
  const expiryHours = parseInt(process.env['AZURE_SAS_EXPIRY_HOURS'] ?? '2', 10);
  const sasUrl = generateSasUrl(containerName, blobName, expiryHours);

  logger.info(`Archivo subido a Azure Blob: ${blobUrl}`);
  return { blobName, blobUrl, sasUrl };
}

/**
 * Elimina un blob de Azure Blob Storage.
 */
export async function deleteBlob(containerName: string, blobName: string): Promise<void> {
  const client = getBlobServiceClient();
  if (!client) return;

  const containerClient = client.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.deleteIfExists();
  logger.info(`Blob eliminado: ${blobName}`);
}

/**
 * Genera una URL SAS temporal para acceder a un blob.
 */
export function getSecureUrl(containerName: string, blobName: string): string | null {
  const expiryHours = parseInt(process.env['AZURE_SAS_EXPIRY_HOURS'] ?? '2', 10);
  return generateSasUrl(containerName, blobName, expiryHours);
}
