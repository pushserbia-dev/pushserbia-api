import { Controller, Get, Query } from '@nestjs/common';
import { UnsplashService } from './unsplash.service';
import { SearchPhotosDto } from './dto/search-photos.dto';

@Controller('unsplash')
export class UnsplashController {
  constructor(private readonly unsplash: UnsplashService) {}

  @Get('search')
  search(@Query() query: SearchPhotosDto) {
    return this.unsplash.searchPhotos(query);
  }
}
