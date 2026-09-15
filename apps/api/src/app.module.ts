import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { WishlistController } from './wishlist.controller';
import { ReviewsController } from './reviews.controller';
import { CmsController } from './cms.controller';
import { ObservabilityController } from './observability.controller';
import { RolesGuard } from './roles.guard';
import { OwnerController } from './owner.controller';

@Module({ providers: [PrismaService], exports: [PrismaService] })
export class DatabaseModule {}

@Module({ imports: [DatabaseModule], controllers: [ProductsController, AuthController, CartController, OrdersController, PaymentController, LibraryController, WishlistController, ReviewsController, CmsController, ObservabilityController, OwnerController], providers: [ProductsService, AuthService, AuthGuard, CartService, OrdersService, PaymentService, LibraryService, RolesGuard] })
export class AppModule {}
