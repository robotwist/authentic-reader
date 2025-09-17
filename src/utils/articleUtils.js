import { FaNewspaper, FaBook, FaPodcast, FaVideo, FaBlog, FaFileAlt, FaGlobeAmericas, FaRegNewspaper } from 'react-icons/fa';
/**
 * Returns the appropriate icon component for a given content type
 * @param contentType - The type of content (article, video, etc.)
 * @returns An icon component from react-icons
 */
export const getArticleTypeIcon = (contentType) => {
    const type = contentType.toLowerCase();
    switch (type) {
        case 'news':
        case 'breaking':
            return FaNewspaper;
        case 'article':
        case 'longform':
            return FaRegNewspaper;
        case 'blog':
        case 'opinion':
            return FaBlog;
        case 'video':
            return FaVideo;
        case 'podcast':
        case 'audio':
            return FaPodcast;
        case 'book':
        case 'publication':
            return FaBook;
        case 'global':
        case 'international':
            return FaGlobeAmericas;
        default:
            return FaFileAlt;
    }
};
