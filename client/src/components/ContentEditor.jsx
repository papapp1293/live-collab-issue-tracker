import { forwardRef, useEffect } from 'react';
import { useImagePaste } from '../hooks/useImagePaste';

/**
 * Reusable ContentEditor component with image paste support
 */
const ContentEditor = forwardRef(({
    placeholder = "Enter text... (You can paste images directly here)",
    minHeight = '100px',
    maxHeight = '300px',
    onContentChange,
    onPaste: customOnPaste,
    initialContent = '',
    style = {},
    className = '',
    ...props
}, ref) => {
    const { handlePaste, handleFocus } = useImagePaste(ref, onContentChange);

    // Set initial content when component mounts or initialContent changes
    useEffect(() => {
        if (ref.current && initialContent && ref.current.innerHTML !== initialContent) {
            ref.current.innerHTML = initialContent;
        }
    }, [initialContent, ref]);

    const combinedPasteHandler = (e) => {
        handlePaste(e);
        if (customOnPaste) {
            customOnPaste(e);
        }
    };

    return (
        <>
            <div
                ref={ref}
                contentEditable
                onInput={onContentChange}
                onPaste={combinedPasteHandler}
                onFocus={handleFocus}
                style={{
                    minHeight,
                    maxHeight,
                    overflow: 'auto',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '12px',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    backgroundColor: 'white',
                    whiteSpace: 'pre-wrap',
                    outline: 'none',
                    ...style
                }}
                data-placeholder={placeholder}
                suppressContentEditableWarning={true}
                className={className}
                {...props}
            />
            <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #999;
          font-style: italic;
          pointer-events: none;
        }
        [contenteditable]:focus:before {
          content: none;
        }
        [contenteditable] img {
          pointer-events: auto;
        }
      `}</style>
        </>
    );
});

ContentEditor.displayName = 'ContentEditor';

export default ContentEditor;
