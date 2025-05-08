export const uploadToCloudinary = async (imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('upload_preset', 'CampusClaim'); // change this
    formData.append('cloud_name', 'dnigecytt'); // optional but can be useful
  
    const res = await fetch(`https://api.cloudinary.com/v1_1/dnigecytt/image/upload`, {
      method: 'POST',
      body: formData,
    });
  
    if (!res.ok) throw new Error('Failed to upload to Cloudinary');
    const data = await res.json();
    return data.secure_url;
  };
  