import { httpClient } from '@/services/http'

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB (stricter than attachment panel's 100MB)

export const isImageFile = (file: File): boolean => {
  return ALLOWED_IMAGE_TYPES.includes(file.type)
}

export const validateImageFile = (
  file: File
): { valid: boolean; error?: string } => {
  if (!isImageFile(file)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
    }
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
    }
  }

  return { valid: true }
}

export const uploadImage = async (
  taskId: string,
  file: File
): Promise<{ url: string; filename: string }> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await httpClient.post<{
    filename: string
    size: number
    content_type: string
    url: string
  }>(`/api/tasks/${taskId}/attachments`, formData, {
    headers: {
      // Remove default Content-Type so browser sets multipart/form-data with boundary
      'Content-Type': undefined,
    },
  })

  return {
    url: response.data.url,
    filename: response.data.filename,
  }
}
