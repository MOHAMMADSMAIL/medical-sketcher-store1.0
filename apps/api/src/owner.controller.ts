import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OwnerService } from './owner.service';
import { AuthGuard } from './auth.guard';
import { Roles, RolesGuard } from './roles.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('owner')
@UseGuards(AuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN')
export class OwnerController {
  constructor(private readonly ownerService: OwnerService) {}

  // Dashboard
  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.ownerService.getDashboardStats();
  }

  // Books
  @Get('books')
  async getBooks(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.ownerService.getBooks(
      parseInt(page || '1'),
      parseInt(limit || '10'),
      { status, search }
    );
  }

  @Get('books/:id')
  async getBook(@Param('id') id: string) {
    return this.ownerService.getBook(id);
  }

  @Post('books')
  async createBook(@Body() data: any) {
    return this.ownerService.createBook(data);
  }

  @Put('books/:id')
  async updateBook(@Param('id') id: string, @Body() data: any) {
    return this.ownerService.updateBook(id, data);
  }

  @Post('books/:id/publish')
  async publishBook(@Param('id') id: string) {
    return this.ownerService.publishBook(id);
  }

  @Post('books/:id/unpublish')
  async unpublishBook(@Param('id') id: string) {
    return this.ownerService.unpublishBook(id);
  }

  @Delete('books/:id')
  async deleteBook(@Param('id') id: string) {
    return this.ownerService.deleteBook(id);
  }

  @Post('books/:id/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/pdf',
          'application/epub+zip',
          'image/jpeg',
          'image/png',
          'audio/mpeg',
          'audio/wav',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type'), false);
        }
      },
    })
  )
  async uploadBookFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('type') fileType: string
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (!fileType) throw new BadRequestException('File type required');
    return this.ownerService.uploadBookFile(id, file, fileType);
  }

  // Authors
  @Get('authors')
  async getAuthors(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.ownerService.getAuthors(
      parseInt(page || '1'),
      parseInt(limit || '10'),
      search
    );
  }

  @Post('authors')
  async createAuthor(@Body() data: any) {
    return this.ownerService.createAuthor(data);
  }

  @Put('authors/:id')
  async updateAuthor(@Param('id') id: string, @Body() data: any) {
    return this.ownerService.updateAuthor(id, data);
  }

  @Delete('authors/:id')
  async deleteAuthor(@Param('id') id: string) {
    return this.ownerService.deleteAuthor(id);
  }

  // Categories
  @Get('categories')
  async getCategories(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.ownerService.getCategories(
      parseInt(page || '1'),
      parseInt(limit || '10'),
      search
    );
  }

  @Post('categories')
  async createCategory(@Body() data: any) {
    return this.ownerService.createCategory(data);
  }

  @Put('categories/:id')
  async updateCategory(@Param('id') id: string, @Body() data: any) {
    return this.ownerService.updateCategory(id, data);
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    return this.ownerService.deleteCategory(id);
  }

  // Orders
  @Get('orders')
  async getOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
  ) {
    return this.ownerService.getOrders(
      parseInt(page || '1'),
      parseInt(limit || '10'),
      { status, paymentStatus }
    );
  }

  @Get('orders/:id')
  async getOrder(@Param('id') id: string) {
    return this.ownerService.getOrder(id);
  }

  // Users
  @Get('users')
  async getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.ownerService.getUsers(
      parseInt(page || '1'),
      parseInt(limit || '10'),
      search
    );
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    return this.ownerService.getUser(id);
  }

  @Put('users/:id/role')
  async updateUserRole(@Param('id') id: string, @Body() data: any) {
    return this.ownerService.updateUserRole(id, data.role);
  }

  // Reviews
  @Get('reviews')
  async getReviews(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('approved') approved?: string,
  ) {
    const approvedBool = approved === 'true' ? true : approved === 'false' ? false : undefined;
    return this.ownerService.getReviews(
      parseInt(page || '1'),
      parseInt(limit || '10'),
      approvedBool
    );
  }

  @Post('reviews/:id/approve')
  async approveReview(@Param('id') id: string) {
    return this.ownerService.approveReview(id);
  }

  @Post('reviews/:id/reject')
  async rejectReview(@Param('id') id: string) {
    return this.ownerService.rejectReview(id);
  }

  // Audit Logs
  @Get('audit-logs')
  async getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
  ) {
    return this.ownerService.getAuditLogs(
      parseInt(page || '1'),
      parseInt(limit || '10'),
      { action, userId }
    );
  }
}
