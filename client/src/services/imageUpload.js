import { uploadAttachment, getAttachmentUrl } from './api';

/**
 * Service for handling image uploads and attachment management
 */
export const imageUploadService = {
    /**
     * Upload multiple pasted images for an issue or comment
     * @param {Array} pastedImages - Array of {file, imageUrl} objects
     * @param {number} issueId - ID of the issue (required)
     * @param {number} commentId - ID of the comment (optional, for comment attachments)
     * @returns {Promise<Array>} Array of upload results with blob URL mapping
     */
    async uploadPastedImages(pastedImages, issueId, commentId = null) {
        const uploadPromises = pastedImages.map(async (imageData) => {
            try {
                const result = await uploadAttachment(imageData.file, issueId, commentId);
                // Handle different response structures
                const attachmentId = result.attachment?.id || result.id;
                if (!attachmentId) {
                    throw new Error('No attachment ID returned from server');
                }
                // Don't revoke the URL yet - we need it for replacement
                return {
                    success: true,
                    result,
                    blobUrl: imageData.imageUrl,
                    serverUrl: getAttachmentUrl(attachmentId)
                };
            } catch (error) {
                // Clean up the object URL on failure
                URL.revokeObjectURL(imageData.imageUrl);
                return { success: false, error, file: imageData.file, blobUrl: imageData.imageUrl };
            }
        });

        return Promise.all(uploadPromises);
    },

    /**
     * Replace blob URLs in HTML content with server URLs
     * @param {string} htmlContent - HTML content containing blob URLs
     * @param {Array} uploadResults - Results from uploadPastedImages
     * @returns {string} Updated HTML content with server URLs
     */
    replaceBlobUrlsWithServerUrls(htmlContent, uploadResults) {
        let updatedContent = htmlContent;

        uploadResults.forEach(result => {
            if (result.success && result.blobUrl && result.serverUrl) {
                // Replace the blob URL with the server URL
                updatedContent = updatedContent.replace(result.blobUrl, result.serverUrl);
            }
        });

        return updatedContent;
    },

    /**
     * Clean up object URLs to prevent memory leaks
     * @param {Array} uploadResults - Results from uploadPastedImages
     */
    cleanupImageUrls(uploadResults) {
        uploadResults.forEach(result => {
            if (result.blobUrl) {
                URL.revokeObjectURL(result.blobUrl);
            }
        });
    }
};
