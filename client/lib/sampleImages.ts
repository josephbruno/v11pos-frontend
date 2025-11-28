// Sample images for different categories and use cases
export const sampleImages = {
  // Food categories
  appetizers: [
    "https://images.unsplash.com/photo-1541014741259-de529411b96a?w=300&h=200&fit=crop", // Caesar salad
    "https://images.unsplash.com/photo-1529059997568-3d847b1154f0?w=300&h=200&fit=crop", // Garlic bread
    "https://images.unsplash.com/photo-1551248429-40975aa4de74?w=300&h=200&fit=crop", // Appetizer platter
  ],
  mainCourse: [
    "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=300&h=200&fit=crop", // Grilled chicken
    "https://images.unsplash.com/photo-1544025162-d76694265947?w=300&h=200&fit=crop", // Fish & chips
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&h=200&fit=crop", // Pasta
    "https://images.unsplash.com/photo-1586816001966-79b736744398?w=300&h=200&fit=crop", // Burger
  ],
  beverages: [
    "https://images.unsplash.com/photo-1546173159-315724a31696?w=300&h=200&fit=crop", // Coca cola
    "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300&h=200&fit=crop", // Coffee
    "https://images.unsplash.com/photo-1570831739435-6601aa3fa4fb?w=300&h=200&fit=crop", // Fresh juice
    "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=300&h=200&fit=crop", // Smoothie
  ],
  desserts: [
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=200&fit=crop", // Chocolate cake
    "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=200&fit=crop", // Ice cream
    "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=200&fit=crop", // Cheesecake
  ],

  // User avatars
  users: [
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face", // Male 1
    "https://images.unsplash.com/photo-1494790108755-2616b612c29d?w=100&h=100&fit=crop&crop=face", // Female 1
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face", // Male 2
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face", // Female 2
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face", // Male 3
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face", // Female 3
  ],

  // Restaurant/business
  restaurant: [
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=300&fit=crop", // Restaurant interior
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=300&fit=crop", // Restaurant dining
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=300&fit=crop", // Restaurant kitchen
  ],

  // Product placeholders
  placeholder:
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop", // Generic food

  // Logos
  logo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=100&h=100&fit=crop", // Restaurant logo placeholder
};

// Helper functions
export const getRandomImage = (category: keyof typeof sampleImages): string => {
  const images = sampleImages[category];
  if (Array.isArray(images)) {
    return images[Math.floor(Math.random() * images.length)];
  }
  return images;
};

export const getImageByIndex = (
  category: keyof typeof sampleImages,
  index: number,
): string => {
  const images = sampleImages[category];
  if (Array.isArray(images)) {
    return images[index % images.length];
  }
  return images;
};

export const getFoodImage = (category: string): string => {
  switch (category.toLowerCase()) {
    case "appetizers":
      return getRandomImage("appetizers");
    case "main-course":
    case "main course":
      return getRandomImage("mainCourse");
    case "beverages":
    case "drinks":
      return getRandomImage("beverages");
    case "desserts":
    case "dessert":
      return getRandomImage("desserts");
    default:
      return sampleImages.placeholder;
  }
};

export const getUserAvatar = (index: number): string => {
  return getImageByIndex("users", index);
};
