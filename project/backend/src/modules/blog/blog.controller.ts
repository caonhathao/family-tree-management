import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AtGuard } from '../auth/guards/auth.guard';
import { BlogService } from './blog.service';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { ResponseFactory } from 'src/common/factories/response.factory';
import { ValidMessageResponse } from 'src/common/messages/messages.response';
import { GetCurrentUserId } from 'src/common/decorators/get-user-id.decorator';
import { HttpStatus } from 'src/common/constants/api';

@ApiTags('blog')
@ApiBearerAuth()
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  @UseGuards(AtGuard)
  @ApiOperation({ summary: 'Create or update a blog (admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Blog created or updated successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateBlog(
    @GetCurrentUserId() userId: string,
    @Body() data: UpdateBlogDto,
  ) {
    const blog = await this.blogService.update(data, userId);
    return ResponseFactory.success({
      data: blog,
      code: HttpStatus.OK,
      message: ValidMessageResponse.UPDATED,
    });
  }

  @Get('list')
  @UseGuards(AtGuard)
  @ApiOperation({ summary: 'Get all blogs (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Blogs retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBlogs(
    @GetCurrentUserId() userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('filter') filter?: string,
    @Query('filterType') filterType?: string,
  ) {
    const blogs = await this.blogService.getAll(
      userId,
      page,
      limit,
      filter,
      filterType,
    );
    return ResponseFactory.success({
      data: blogs,
      message: ValidMessageResponse.GETTED,
    });
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a blog by slug' })
  @ApiParam({ name: 'slug', description: 'Blog slug' })
  @ApiResponse({ status: 200, description: 'Blog retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Blog not found' })
  async getBlog(@Param('slug') slug: string) {
    const blog = await this.blogService.getOne(slug);
    return ResponseFactory.success({
      data: blog,
      message: ValidMessageResponse.GETTED,
    });
  }
}
