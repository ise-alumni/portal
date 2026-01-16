/**
 * Image utilities for consistent fallback handling
 */

export const generatePlaceholderUrl = (type: string, id: string | number): string => {
  return `https://placehold.co/600x400?text=${type}+${id}`;
};

export const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackUrl?: string
): void => {
  const target = event.target as HTMLImageElement;
  
  if (fallbackUrl) {
    target.src = fallbackUrl;
  } else {
    // Generate a random fallback if none provided
    const randomId = Math.floor(Math.random() * 1000);
    const currentSrc = target.src;
    const type = currentSrc.includes('Event') ? 'Event' : 
                 currentSrc.includes('Announcement') ? 'Announcement' : 'Image';
    target.src = generatePlaceholderUrl(type, randomId);
  }
};

export const getProfileInitials = (fullName?: string | null): string => {
  if (!fullName) return 'U';
  
  return fullName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};