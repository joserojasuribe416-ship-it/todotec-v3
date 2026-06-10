import cloudinary
import cloudinary.uploader
import logging
import os

logger = logging.getLogger("todotec.cloudinary")

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", ""),
    api_key=os.getenv("CLOUDINARY_API_KEY", ""),
    api_secret=os.getenv("CLOUDINARY_API_SECRET", ""),
    secure=True,
)


async def upload_image(file, folder: str = "glowi-skin", public_id: str = None) -> str:
    """Upload a file-like object to Cloudinary and return the secure URL."""
    contents = await file.read()
    kwargs = {"folder": folder, "overwrite": True}
    if public_id:
        kwargs["public_id"] = public_id
    result = cloudinary.uploader.upload(contents, **kwargs)
    return result["secure_url"]


def delete_image(url: str):
    """Delete an image from Cloudinary given its URL. Silently ignores errors."""
    if not url or "cloudinary.com" not in url:
        return
    try:
        # Extract public_id from URL: .../upload/v123/folder/name.ext -> folder/name
        parts = url.split("/upload/")
        if len(parts) < 2:
            return
        after_upload = parts[1]
        # Remove version segment if present (v1234567/)
        segments = after_upload.split("/")
        if segments[0].startswith("v") and segments[0][1:].isdigit():
            segments = segments[1:]
        public_id_with_ext = "/".join(segments)
        public_id = public_id_with_ext.rsplit(".", 1)[0]
        cloudinary.uploader.destroy(public_id)
    except Exception as e:
        # No interrumpe la operación principal, pero queda registrado
        logger.warning("No se pudo eliminar imagen en Cloudinary (%s): %s", url, e)
