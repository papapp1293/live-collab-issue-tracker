import { useState } from 'react';

/**
 * Custom hook for handling image paste functionality in contentEditable elements
 * @param {React.RefObject} editorRef - Reference to the contentEditable element
 * @param {Function} onContentChange - Callback to update content when editor changes
 * @returns {Object} Hook utilities and state
 */
export const useImagePaste = (editorRef, onContentChange) => {
    const [pastedImages, setPastedImages] = useState([]);

    const createImageElement = (file, imageUrl) => {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = file.name || 'Pasted image';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.style.margin = '10px 0';
        img.style.border = '1px solid #ddd';
        img.style.borderRadius = '4px';
        return img;
    };

    const insertImageAtCursor = (img, editor) => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents(); // Clear any selected content
            range.insertNode(img);

            // Move cursor after the image
            range.setStartAfter(img);
            range.setEndAfter(img);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            // No selection, append to end
            editor.appendChild(img);
        }
    };

    const handlePaste = async (e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file' && item.type.startsWith('image/')) {
                e.preventDefault(); // Prevent default paste behavior
                const file = item.getAsFile();

                // Clear the editor if it's empty or only has placeholder content
                if (editorRef.current &&
                    (editorRef.current.textContent.trim() === '' ||
                        editorRef.current.innerHTML.trim() === '')) {
                    editorRef.current.innerHTML = '';
                }

                // Create object URL for immediate display
                const imageUrl = URL.createObjectURL(file);

                // Create and insert img element
                const img = createImageElement(file, imageUrl);
                insertImageAtCursor(img, editorRef.current);

                // Store file for upload later
                setPastedImages(prev => [...prev, { file, imageUrl }]);

                // Update content if callback provided
                if (onContentChange) {
                    onContentChange();
                }
            }
        }
    };

    const clearPastedImages = () => {
        setPastedImages([]);
    };

    const handleFocus = (e) => {
        // Clear placeholder text when focused
        if (e.target.textContent === '') {
            e.target.innerHTML = '';
        }
    };

    return {
        pastedImages,
        handlePaste,
        clearPastedImages,
        handleFocus,
        setPastedImages
    };
};
