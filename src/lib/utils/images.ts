/**
 * Image generation utilities
 */

export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>): void => {
  const target = event.target as HTMLImageElement;
  // Generate a new random image URL
  const randomId = Math.floor(Math.random() * 1000);
  const currentSrc = target.src;
  
  if (currentSrc.toLowerCase().includes('event')) {
    target.src = `https://placehold.co/600x400?text=Event+${randomId}`;
  } else if (currentSrc.toLowerCase().includes('announcement')) {
    target.src = `https://placehold.co/600x400?text=Announcement+${randomId}`;
  } else {
    // Fallback for any other image type
    target.src = `https://placehold.co/600x400?text=Placeholder+${randomId}`;
  }
};