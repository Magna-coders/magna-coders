interface PostValidationResult {
  postType?: string;
  textSubmission?: string;
  linkSubmission?: string;
  imageSubmission?: string;
}

const postTypeValidator = (
  postType: string,
  textSubmission?: string,
  linkSubmission?: string,
  imageSubmission?: string
): PostValidationResult => {
  const result: PostValidationResult = { postType };

  switch (postType) {
    case 'Text':
      if (!textSubmission || textSubmission.trim().length === 0) {
        throw new Error('Text submission is required for text posts');
      }
      if (textSubmission.length > 10000) {
        throw new Error('Text submission cannot exceed 10000 characters');
      }
      result.textSubmission = textSubmission.trim();
      break;

    case 'Link':
      if (!linkSubmission || linkSubmission.trim().length === 0) {
        throw new Error('Link submission is required for link posts');
      }
      // Basic URL validation
      try {
        new URL(linkSubmission);
      } catch {
        throw new Error('Invalid URL format');
      }
      result.linkSubmission = linkSubmission.trim();
      break;

    case 'Image':
      if (!imageSubmission) {
        throw new Error('Image submission is required for image posts');
      }
      // Image validation will be handled by cloudinary upload
      result.imageSubmission = imageSubmission;
      break;

    case 'Project':
      // Project posts might have additional validation
      if (textSubmission && textSubmission.length > 10000) {
        throw new Error('Project description cannot exceed 10000 characters');
      }
      if (textSubmission) result.textSubmission = textSubmission.trim();
      break;

    default:
      throw new Error('Invalid post type');
  }

  return result;
};

export default postTypeValidator;