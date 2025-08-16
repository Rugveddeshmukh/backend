const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');
const cloudinary = require('../config/cloudinary');

const sanitize = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = path.extname(file.originalname).slice(1).toLowerCase();
    const base = sanitize(path.basename(file.originalname, path.extname(file.originalname)));

    const isDoc = ['ppt', 'pptx', 'pdf'].includes(ext);
    const isImage = file.mimetype.startsWith('image/');

    
    if (file.fieldname === 'ppt' || isDoc) {
      return {
        folder: 'presentations',
        resource_type: 'raw', 
        public_id: `${Date.now()}_${base}`,
        format: ext || undefined, 
      };
    }

    if (file.fieldname === 'thumbnail' || isImage) {
      return {
        folder: 'presentation_thumbnails',
        resource_type: 'image',
        public_id: `${Date.now()}_${base}`,
        
      };
    }

    // Fallback: treat as raw
    return {
      folder: 'other_uploads',
      resource_type: 'raw',
      public_id: `${Date.now()}_${base}`,
      format: ext || undefined,
    };
  },
});

const fileFilter = (req, file, cb) => {
  const allowedDocs = ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/pdf'];
  const isDoc = allowedDocs.includes(file.mimetype);
  const isImage = file.mimetype.startsWith('image/');

  if (file.fieldname === 'ppt') {
    return isDoc ? cb(null, true) : cb(new Error('Only PPT/PPTX/PDF allowed for ppt'), false);
  }
  if (file.fieldname === 'thumbnail') {
    return isImage ? cb(null, true) : cb(new Error('Only image files allowed for thumbnail'), false);
  }
  return cb(new Error('Unexpected field'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB (adjust if needed)
  },
});

module.exports = upload;
