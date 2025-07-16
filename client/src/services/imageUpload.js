import { uploadAttachment } from './api';

/**
 * Service for handling image uploads and attachment management
 */
export const imageUploadService = {
    /**
     * Upload multiple pasted images for an issue or comment
     * @param {Array} pastedImages - Array of {file, imageUrl} objects
     * @param {number} issueId - ID of the issue (required)
     * @param {number} commentId - ID of the comment (optional, for comment attachments)
     * @returns {Promise<Array>} Array of upload results
     */
    async uploadPastedImages(pastedImages, issueId, commentId = null) {
        const uploadPromises = pastedImages.map(async (imageData) => {
            try {
                const result = await uploadAttachment(imageData.file, issueId, commentId);
                // Clean up the object URL to prevent memory leaks
                URL.revokeObjectURL(imageData.imageUrl);
                return { success: true, result };
            } catch (error) {
                console.error('Failed to upload image:', error);
                // Clean up the object URL even on failure
                URL.revokeObjectURL(imageData.imageUrl);
                return { success: false, error, file: imageData.file };
            }
        });

        return Promise.all(uploadPromises);
    },

    /**
     * Clean up object URLs to prevent memory leaks
     * @param {Array} pastedImages - Array of {file, imageUrl} objects
     */
    cleanupImageUrls(pastedImages) {
        pastedImages.forEach(imageData => {
            if (imageData.imageUrl) {
                URL.revokeObjectURL(imageData.imageUrl);
            }
        });
    }
};
