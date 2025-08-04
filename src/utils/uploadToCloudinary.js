// src/utils/uploadToCloudinary.js

export const uploadToCloudinary = async (imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('upload_preset', 'CampusClaim'); 
    formData.append('cloud_name', 'dnigecytt');
 
    const res = await fetch(`https://api.cloudinary.com/v1_1/dnigecytt/image/upload`, {
      method: 'POST',
      body: formData,
    });
 
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error('Failed to upload to Cloudinary: ' + errorData.error.message);
    }

    const data = await res.json();
    
    // --- THIS IS THE CRITICAL CHANGE ---
    // Return the entire data object, not just the URL string
    return data;
};