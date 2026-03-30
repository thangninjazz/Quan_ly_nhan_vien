import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { AuthModule } from '../auth/auth.module';
import { PieceRateController } from './piece-rate.controller';

@Module({
  imports: [AuthModule],
  providers: [ProductService],
  controllers: [ProductController, PieceRateController],
  exports: [ProductService],
})
export class ProductModule {}
