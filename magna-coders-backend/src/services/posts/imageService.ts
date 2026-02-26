import { cloudinary } from '../../utils/config';

// TypeScript interfaces
interface ImageUploadResult {
  imageLink: string;
  imageId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

interface ImageDeleteResult {
  result: string;
  rate_limit_allowed?: number;
  rate_limit_reset_at?: string;
  rate_limit_remaining?: number;
}

interface ImageServiceResponse {
  success: boolean;
  data?: ImageUploadResult | ImageDeleteResult;
  message?: string;
}

interface ImageError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}

// Logger utility
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[IMAGE SERVICE INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[IMAGE SERVICE ERROR] ${message}`, error ? JSON.stringify(error, null, 2) : '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[IMAGE SERVICE WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

class ImageService {
  // Upload image to Cloudinary
  async uploadImage(
    imageBuffer: Buffer,
    options: {
      preset?: string;
      folder?: string;
      publicId?: string;
      transformation?: any[];
    } = {}
  ): Promise<ImageUploadResult> {
    try {
      const {
        preset = 'default',
        folder,
        publicId,
        transformation
      } = options;

      logger.info('Uploading image to Cloudinary', {
        preset,
        folder,
        publicId,
        bufferSize: imageBuffer.length
      });

      return new Promise((resolve, reject) => {
        const uploadOptions: any = {
          upload_preset: preset,
          resource_type: 'image',
        };

        if (folder) uploadOptions.folder = folder;
        if (publicId) uploadOptions.public_id = publicId;
        if (transformation) uploadOptions.transformation = transformation;

        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error: any, result: any) => {
            if (error) {
              const cloudinaryError: ImageError = {
                code: 'UPLOAD_FAILED',
                message: `Image upload failed: ${error.message}`,
                statusCode: 500,
                details: error
              };
              logger.error('Cloudinary upload error', cloudinaryError);
              reject(cloudinaryError);
            } else if (result) {
              const uploadResult: ImageUploadResult = {
                imageLink: result.secure_url,
                imageId: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format,
                bytes: result.bytes
              };

              logger.info('Image uploaded successfully', {
                imageId: result.public_id,
                url: result.secure_url,
                size: result.bytes
              });

              resolve(uploadResult);
            } else {
              const unknownError: ImageError = {
                code: 'UPLOAD_FAILED',
                message: 'Upload failed: No result returned',
                statusCode: 500
              };
              logger.error('Cloudinary upload failed: No result', unknownError);
              reject(unknownError);
            }
          }
        );

        uploadStream.end(imageBuffer);
      });

    } catch (error: any) {
      // Re-throw custom errors
      if (error.code && error.statusCode) {
        throw error;
      }

      logger.error('Unexpected error in uploadImage', error);
      const unexpectedError: ImageError = {
        code: 'UPLOAD_ERROR',
        message: 'An unexpected error occurred during image upload',
        statusCode: 500,
        details: error.message
      };
      throw unexpectedError;
    }
  }

  // Delete image from Cloudinary
  async deleteImage(imageId: string): Promise<ImageDeleteResult> {
    try {
      if (!imageId) {
        const error: ImageError = {
          code: 'INVALID_IMAGE_ID',
          message: 'Image ID is required',
          statusCode: 400
        };
        logger.error('Invalid image ID for deletion', error);
        throw error;
      }

      logger.info('Deleting image from Cloudinary', { imageId });

      return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(imageId, (error: any, result: any) => {
          if (error) {
            const cloudinaryError: ImageError = {
              code: 'DELETE_FAILED',
              message: `Image deletion failed: ${error.message}`,
              statusCode: 500,
              details: error
            };
            logger.error('Cloudinary delete error', cloudinaryError);
            reject(cloudinaryError);
          } else {
            logger.info('Image deleted successfully', {
              imageId,
              result: result.result
            });
            resolve(result);
          }
        });
      });

    } catch (error: any) {
      // Re-throw custom errors
      if (error.code && error.statusCode) {
        throw error;
      }

      logger.error('Unexpected error in deleteImage', error);
      const unexpectedError: ImageError = {
        code: 'DELETE_ERROR',
        message: 'An unexpected error occurred during image deletion',
        statusCode: 500,
        details: error.message
      };
      throw unexpectedError;
    }
  }

  // Bulk delete images
  async deleteImages(imageIds: string[]): Promise<ImageDeleteResult[]> {
    try {
      if (!Array.isArray(imageIds) || imageIds.length === 0) {
        const error: ImageError = {
          code: 'INVALID_IMAGE_IDS',
          message: 'Image IDs array is required and cannot be empty',
          statusCode: 400
        };
        logger.error('Invalid image IDs for bulk deletion', error);
        throw error;
      }

      logger.info('Bulk deleting images from Cloudinary', {
        count: imageIds.length,
        imageIds
      });

      const deletePromises = imageIds.map(id => this.deleteImage(id));
      const results = await Promise.allSettled(deletePromises);

      const successful: ImageDeleteResult[] = [];
      const failed: any[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(result.value);
        } else {
          failed.push({
            imageId: imageIds[index],
            error: result.reason
          });
        }
      });

      if (failed.length > 0) {
        logger.warn('Some images failed to delete', { failed });
      }

      logger.info('Bulk image deletion completed', {
        total: imageIds.length,
        successful: successful.length,
        failed: failed.length
      });

      return successful;

    } catch (error: any) {
      // Re-throw custom errors
      if (error.code && error.statusCode) {
        throw error;
      }

      logger.error('Unexpected error in deleteImages', error);
      const unexpectedError: ImageError = {
        code: 'BULK_DELETE_ERROR',
        message: 'An unexpected error occurred during bulk image deletion',
        statusCode: 500,
        details: error.message
      };
      throw unexpectedError;
    }
  }

  // Get image info from Cloudinary
  async getImageInfo(imageId: string): Promise<any> {
    try {
      if (!imageId) {
        const error: ImageError = {
          code: 'INVALID_IMAGE_ID',
          message: 'Image ID is required',
          statusCode: 400
        };
        logger.error('Invalid image ID for info retrieval', error);
        throw error;
      }

      logger.info('Getting image info from Cloudinary', { imageId });

      return new Promise((resolve, reject) => {
        cloudinary.api.resource(imageId, (error: any, result: any) => {
          if (error) {
            const cloudinaryError: ImageError = {
              code: 'INFO_RETRIEVAL_FAILED',
              message: `Image info retrieval failed: ${error.message}`,
              statusCode: 500,
              details: error
            };
            logger.error('Cloudinary info retrieval error', cloudinaryError);
            reject(cloudinaryError);
          } else {
            logger.info('Image info retrieved successfully', {
              imageId,
              format: result.format,
              bytes: result.bytes
            });
            resolve(result);
          }
        });
      });

    } catch (error: any) {
      // Re-throw custom errors
      if (error.code && error.statusCode) {
        throw error;
      }

      logger.error('Unexpected error in getImageInfo', error);
      const unexpectedError: ImageError = {
        code: 'INFO_ERROR',
        message: 'An unexpected error occurred while retrieving image info',
        statusCode: 500,
        details: error.message
      };
      throw unexpectedError;
    }
  }

  // Generate optimized image URL
  generateOptimizedUrl(imageId: string, options: {
    width?: number;
    height?: number;
    quality?: number | string;
    format?: string;
    crop?: string;
  } = {}): string {
    const {
      width,
      height,
      quality = 'auto',
      format = 'auto',
      crop
    } = options;

    let transformation = `q_${quality},f_${format}`;
    if (width) transformation += `,w_${width}`;
    if (height) transformation += `,h_${height}`;
    if (crop) transformation += `,c_${crop}`;

    return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${transformation}/${imageId}`;
  }
}

export default ImageService;