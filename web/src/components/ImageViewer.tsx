import React, { useState } from 'react';
import { 
  PhotoIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardIcon,
  CheckIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface ImageViewerProps {
  content: {
    type: 'image';
    source: {
      type: 'base64';
      data: string;
      media_type?: string;
    };
  };
  index: number;
  contentNumber?: number;
  onCopy?: (text: string, fieldName: string) => void;
  copiedField?: string | null;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ 
  content, 
  index, 
  contentNumber, 
  onCopy,
  copiedField 
}) => {
  const [showImage, setShowImage] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Detect media type from base64 data if not provided
  const detectMediaType = (base64Data: string): string => {
    if (base64Data.startsWith('/9j/')) return 'image/jpeg';
    if (base64Data.startsWith('iVBORw0KGgo')) return 'image/png';
    if (base64Data.startsWith('R0lGOD')) return 'image/gif';
    if (base64Data.startsWith('UklGR')) return 'image/webp';
    return 'image/png'; // fallback
  };

  const mediaType = content.source.media_type || detectMediaType(content.source.data);
  const imageDataUrl = `data:${mediaType};base64,${content.source.data}`;
  
  // Get image size info
  const base64Size = content.source.data.length;
  const estimatedFileSize = Math.round((base64Size * 3) / 4); // rough estimate
  const sizeInKB = (estimatedFileSize / 1024).toFixed(1);

  const handleCopyBase64 = () => {
    if (onCopy) {
      onCopy(content.source.data, `image-base64-${index}`);
    }
  };

  const handleCopyDataUrl = () => {
    if (onCopy) {
      onCopy(imageDataUrl, `image-dataurl-${index}`);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  return (
    <div className="rounded-xl p-4 border border-blue-200 dark:border-blue-600 shadow-sm bg-blue-50 dark:bg-blue-900/20">
      <div className="flex items-start space-x-3 mb-4">
        <div className="h-6 w-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center flex-shrink-0">
          <PhotoIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300 font-['Inter',sans-serif]">
                Image Content {contentNumber !== undefined ? `#${contentNumber + 1}` : ''}
              </span>
              <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                {mediaType.split('/')[1].toUpperCase()}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowImage(!showImage)}
                className="flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                {showImage ? (
                  <>
                    <EyeSlashIcon className="h-3 w-3" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <EyeIcon className="h-3 w-3" />
                    <span>Show</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-blue-600 dark:text-blue-400">
            <div className="flex items-center space-x-1">
              <InformationCircleIcon className="h-3 w-3" />
              <span>Size: ~{sizeInKB} KB</span>
            </div>
            <div>Format: {mediaType}</div>
          </div>
        </div>
      </div>

      {showImage && (
        <div className="mb-4">
          {!imageError ? (
            <div className="relative bg-white dark:bg-slate-800 rounded-lg p-2 border border-blue-200/50 dark:border-blue-700/50">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200 border-t-blue-600"></div>
                </div>
              )}
              <img
                src={imageDataUrl}
                alt="Uploaded content"
                className={`max-w-full h-auto rounded border border-slate-200 dark:border-slate-600 transition-opacity duration-200 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ maxHeight: '400px' }}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
                <InformationCircleIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Failed to load image</span>
              </div>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                The image data may be corrupted or in an unsupported format.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center space-x-2 pt-3 border-t border-blue-200/50 dark:border-blue-700/50">
        <button
          onClick={handleCopyDataUrl}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            copiedField === `image-dataurl-${index}`
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60'
          }`}
        >
          {copiedField === `image-dataurl-${index}` ? (
            <>
              <CheckIcon className="h-3 w-3" />
              <span>Data URL Copied!</span>
            </>
          ) : (
            <>
              <ClipboardIcon className="h-3 w-3" />
              <span>Copy Data URL</span>
            </>
          )}
        </button>
        
        <button
          onClick={handleCopyBase64}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            copiedField === `image-base64-${index}`
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
          }`}
        >
          {copiedField === `image-base64-${index}` ? (
            <>
              <CheckIcon className="h-3 w-3" />
              <span>Base64 Copied!</span>
            </>
          ) : (
            <>
              <ClipboardIcon className="h-3 w-3" />
              <span>Copy Base64</span>
            </>
          )}
        </button>
        
        <div className="flex-1"></div>
        
        <span className="text-xs text-blue-600 dark:text-blue-400">
          {base64Size.toLocaleString()} chars
        </span>
      </div>
    </div>
  );
};

export default ImageViewer;