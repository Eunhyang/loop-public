import { httpClient } from '@/services/http'
import { authStorage } from '@/features/auth/storage'

// API base URL for constructing absolute image URLs
const getApiBaseUrl = (): string => {
  // In production, use the MCP server URL
  // In development, Vite proxy handles /api/* but <img> tags need absolute URLs with auth
  return import.meta.env.VITE_API_URL || 'https://mcp.sosilab.synology.me'
}

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
    success: boolean
    task_id: string
    message: string
    attachment: {
      filename: string
      size: number
      content_type: string
      uploaded_at: string
      url: string
    }
  }>(`/api/tasks/${taskId}/attachments`, formData, {
    headers: {
      // Remove default Content-Type so browser sets multipart/form-data with boundary
      'Content-Type': undefined,
    },
  })

  if (!response.data.attachment) {
    throw new Error('Upload failed: no attachment data in response')
  }

  // Construct absolute URL with auth token for <img> tag to load
  // Note: <img src=""> doesn't use axios, so we need token in URL
  const token = authStorage.getToken()
  const baseUrl = getApiBaseUrl()
  const attachmentPath = `/api/tasks/${taskId}/attachments/${encodeURIComponent(response.data.attachment.filename)}`
  const imageUrl = token
    ? `${baseUrl}${attachmentPath}?token=${encodeURIComponent(token)}`
    : `${baseUrl}${attachmentPath}`

  return {
    url: imageUrl,
    filename: response.data.attachment.filename,
  }
}
