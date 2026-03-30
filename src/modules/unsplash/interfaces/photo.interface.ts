import { PhotoUrlSet } from './photo-url-set.interface';
import { UserLite } from './user-lite.interface';

export interface Photo {
  id: string;
  width: number;
  height: number;
  color?: string;
  alt_description?: string;
  urls: PhotoUrlSet;
  user: UserLite;
  links: {
    html: string;
    download: string;
    download_location: string;
  };
}
