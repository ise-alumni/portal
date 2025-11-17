/**
 * Image generation utilities
 */

export const getRandomEventImage = (): string => {
  const randomId = Math.floor(Math.random() * 1000);
  return `https://picsum.photos/seed/event${randomId}/400/200.jpg`;
};

export const getRandomAnnouncementImage = (): string => {
  const randomId = Math.floor(Math.random() * 1000);
  return `https://picsum.photos/seed/announcement${randomId}/400/200.jpg`;
};

export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>): void => {
  const target = event.target as HTMLImageElement;
  // Generate a new random image URL
  const randomId = Math.floor(Math.random() * 1000);
  const currentSrc = target.src;
  
  if (currentSrc.includes('event')) {
    target.src = `https://picsum.photos/seed/event${randomId}/400/200.jpg`;
  } else if (currentSrc.includes('announcement')) {
    target.src = `https://picsum.photos/seed/announcement${randomId}/400/200.jpg`;
  } else {
    // Fallback for any other image type
    target.src = `https://picsum.photos/seed/fallback${randomId}/400/200.jpg`;
  }
};