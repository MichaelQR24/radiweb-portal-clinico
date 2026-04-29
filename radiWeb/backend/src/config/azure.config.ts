import { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions, SASProtocol } from '@azure/storage-blob';
import { logger } from '../utils/logger';

let blobServiceClient: BlobServiceClient | null = null;

/**
 * Obtiene el cliente de Azure Blob Storage.
 * Retorna null si las credenciales no están configuradas (modo dev).
 */
export function getBlobServiceClient(): BlobServiceClient | null {
  const connectionString = process.env['AZURE_STORAGE_CONNECTION_STRING'] ?? '';

  if (!connectionString || connectionString.startsWith('DefaultEndpointsProtocol=https;AccountName=.')) {
    logger.warn('⚠️  Azure Blob Storage no configurado – usando modo mock en desarrollo');
    return null;
  }

  if (!blobServiceClient) {
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    logger.info('✅ Cliente Azure Blob Storage inicializado');
  }

  return blobServiceClient;
}

/**
 * Genera una URL SAS con tiempo de expiración limitado para un blob.
 * @param containerName - Nombre del contenedor
 * @param blobName - Nombre del blob
 * @param expiryHours - Horas de validez (por defecto 2)
 */
export function generateSasUrl(containerName: string, blobName: string, expiryHours = 2): string | null {
  const connectionString = process.env['AZURE_STORAGE_CONNECTION_STRING'] ?? '';
  if (!connectionString || connectionString.startsWith('DefaultEndpointsProtocol=https;AccountName=.')) {
    return null;
  }

  try {
    // Extraer nombre de cuenta y clave del connection string
    const accountNameMatch = connectionString.match(/AccountName=([^;]+)/);
    const accountKeyMatch = connectionString.match(/AccountKey=([^;]+)/);

    if (!accountNameMatch || !accountKeyMatch) {
      return null;
    }

    const accountName = accountNameMatch[1];
    const accountKey = accountKeyMatch[1];

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey ?? '');

    const expiresOn = new Date();
    expiresOn.setHours(expiresOn.getHours() + expiryHours);

    const sasOptions = {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse('r'),
      protocol: SASProtocol.Https,
      expiresOn,
    };

    const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
    return `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
  } catch (error) {
    logger.error('Error generando SAS URL:', error);
    return null;
  }
}
