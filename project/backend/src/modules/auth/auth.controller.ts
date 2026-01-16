// Contains important business logic:

import {
  Body,
  Controller,
  Ip,
  Post,
  Headers,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { ResponseFactory } from 'src/common/factories/response.factory';
import { ValidMessageResponse } from 'src/common/messages/messages.response';
import { AuthService } from './auth.service';
import { LoginBaseDto } from './dto/login.dto';
import { HttpStatus } from 'src/common/constants/api';
import { RtGuard } from './guards/auth.guard';
import { GetCurrentUserId } from 'src/common/decorators/get-user-id.decorator';
import { GetCurrentUser } from 'src/common/decorators/get-user.decorator';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

// Verifies the username and password.

// Encrypts the password (usually using the bcrypt library) before saving it to PostgreSQL via Prisma.

// Generates a JWT (JSON Web Token) string to return to the user.

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh token authorization' })
  @ApiResponse({ status: 200, description: 'data with tokens' })
  @UseGuards(RtGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('refreshToken') refreshToken: string,
  ) {
    const auth = await this.authService.refresh(userId, refreshToken);
    return ResponseFactory.success({
      data: auth,
      message: ValidMessageResponse.GETTED,
    });
  }

  @Post('register')
  @ApiOperation({ summary: 'Register new account' })
  @ApiResponse({ status: 200, description: 'data with tokens' })
  async register(
    @Body() registerDto: RegisterDto,
    @Ip() ip: string, // NestJS tự động lấy IP (xử lý luôn cả proxy)
    @Headers('user-agent') userAgent: string, // Lấy trực tiếp User-Agent từ header
  ) {
    const user = await this.authService.register(registerDto, {
      ipAddress: ip,
      userAgent: userAgent,
    });

    return ResponseFactory.success({
      data: user,
      message: ValidMessageResponse.REGISTER,
    });
  }

  @Post('login-base')
  @ApiOperation({ summary: 'Login' })
  @ApiResponse({ status: 200, description: 'data with tokens' })
  async loginBase(
    @Body() loginBase: LoginBaseDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const user = await this.authService.loginBase(loginBase, {
      ipAddress: ip,
      userAgent: userAgent,
    });

    return ResponseFactory.success({
      data: user,
      message: ValidMessageResponse.LOGIN,
    });
  }
}
