// Contains important business logic:

import {
  Body,
  Controller,
  Ip,
  Post,
  Get,
  Headers,
  HttpCode,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { ResponseFactory } from 'src/common/factories/response.factory';
import { ValidMessageResponse } from 'src/common/messages/messages.response';
import { AuthService } from './auth.service';
import { LoginBaseDto } from './dto/login.dto';
import {
  ApiResponse as ApiResponseType,
  HttpStatus,
} from 'src/common/constants/api';
import {
  AuthActionResponse,
  AuthLoginInfoResponse,
  AuthResponse,
  AuthStatusResponse,
} from './types/auth-response.type';
import { AtGuard, RtGuard } from './guards/auth.guard';
import { GetCurrentUserId } from 'src/common/decorators/get-user-id.decorator';
import { GetCurrentUser } from 'src/common/decorators/get-user.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { CreateBaseAuthDto } from './dto/create-base-auth.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { UnlinkProviderDto } from './dto/unlink-provider.dto';
import { VerifyPasswordDto } from './dto/verify-password.dto';
import { VerifyGoogleDto } from './dto/verify-google.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';

// Verifies the username and password.

// Encrypts the password (usually using the bcrypt library) before saving it to PostgreSQL via Prisma.

// Generates a JWT (JSON Web Token) string to return to the user.

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(AtGuard)
  @ApiOperation({ summary: 'Get current user info from access token' })
  @ApiResponse({ status: 200, description: 'User info retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@GetCurrentUser() user: { id: string; role: string }) {
    return ResponseFactory.success({
      data: { id: user.id, role: user.role },
      code: HttpStatus.OK,
      message: ValidMessageResponse.GETTED,
    });
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh token authorization' })
  @ApiResponse({ status: 200, description: 'Refresh tokens successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(RtGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('refreshToken') refreshToken: string,
  ): Promise<AuthResponse> {
    const auth = await this.authService.refresh(userId, refreshToken);
    return ResponseFactory.success({
      data: auth,
      message: ValidMessageResponse.GETTED,
    });
  }

  @Post('register')
  @ApiOperation({ summary: 'Register new account' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(
    @Body() registerDto: RegisterDto,
    @Ip() ip: string, // NestJS tự động lấy IP (xử lý luôn cả proxy)
    @Headers('user-agent') userAgent: string, // Lấy trực tiếp User-Agent từ header
  ): Promise<AuthResponse> {
    const user = await this.authService.register(registerDto, {
      ipAddress: ip,
      userAgent: userAgent,
    });

    return ResponseFactory.success({
      data: user,
      code: HttpStatus.CREATED,
      message: ValidMessageResponse.REGISTER,
    });
  }

  @Post('login-base')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async loginBase(
    @Body() loginBase: LoginBaseDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthResponse> {
    const user = await this.authService.loginBase(loginBase, {
      ipAddress: ip,
      userAgent: userAgent,
    });

    return ResponseFactory.success({
      data: user,
      code: HttpStatus.OK,
      message: ValidMessageResponse.LOGIN,
    });
  }

  @Post('login-google')
  @ApiOperation({ summary: 'Login with google account' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async loginGoogle(
    @Body() data: GoogleLoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthResponse> {
    const user = await this.authService.loginGoogle(data, {
      ipAddress: ip,
      userAgent: userAgent,
    });

    return ResponseFactory.success({
      data: user,
      code: HttpStatus.OK,
      message: ValidMessageResponse.LOGIN,
    });
  }

  @Post('reset')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetPassword(
    @Body() resetData: ResetPasswordDto,
  ): Promise<ApiResponseType<void>> {
    const user = await this.authService.resetPassword(resetData);

    return ResponseFactory.success({
      data: user,
      code: HttpStatus.OK,
      message: ValidMessageResponse.LOGIN,
    });
  }

  @Post('create-base-auth')
  @UseGuards(AtGuard)
  @ApiOperation({ summary: 'Create base auth for current user' })
  @ApiResponse({ status: 200, description: 'Create base auth successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createBaseAuth(
    @GetCurrentUserId() userId: string,
    @Body() data: CreateBaseAuthDto,
  ): Promise<AuthActionResponse> {
    const result = await this.authService.createBaseAuth(data, userId);

    return ResponseFactory.success({
      data: result,
      code: HttpStatus.OK,
      message: ValidMessageResponse.CREATED,
    });
  }

  @Post('change-password')
  @UseGuards(AtGuard)
  @ApiOperation({ summary: 'Change password of current user' })
  @ApiResponse({ status: 200, description: 'Change password successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @GetCurrentUserId() userId: string,
    @Body() data: ChangePasswordDto,
    @Headers('x-session-token') currentToken: string,
  ): Promise<AuthActionResponse> {
    const result = await this.authService.changePassword(
      userId,
      data,
      currentToken,
    );

    return ResponseFactory.success({
      data: result,
      code: HttpStatus.OK,
      message: ValidMessageResponse.UPDATED,
    });
  }

  @Post('change-email')
  @UseGuards(AtGuard)
  @ApiOperation({ summary: 'Change email of current user (base auth)' })
  @ApiResponse({ status: 200, description: 'Change email successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changeEmail(
    @GetCurrentUserId() userId: string,
    @Body() data: ChangeEmailDto,
    @Headers('x-session-token') currentToken: string,
  ): Promise<AuthActionResponse> {
    const result = await this.authService.changeEmail(
      userId,
      data,
      currentToken,
    );

    return ResponseFactory.success({
      data: result,
      code: HttpStatus.OK,
      message: ValidMessageResponse.UPDATED,
    });
  }

  @Post('unlink-provider')
  @UseGuards(AtGuard)
  @ApiOperation({ summary: 'Unlink an auth provider of current user' })
  @ApiResponse({ status: 200, description: 'Unlink provider successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unlinkProvider(
    @GetCurrentUserId() userId: string,
    @Body() data: UnlinkProviderDto,
  ): Promise<AuthActionResponse> {
    const result = await this.authService.unlinkProvider(userId, data);

    return ResponseFactory.success({
      data: result,
      code: HttpStatus.OK,
      message: ValidMessageResponse.UPDATED,
    });
  }

  @Post('link-google')
  @UseGuards(AtGuard)
  @ApiOperation({ summary: 'Link a google account to current user' })
  @ApiResponse({ status: 200, description: 'Link google successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async linkGoogle(
    @GetCurrentUserId() userId: string,
    @Body() data: GoogleLoginDto,
  ): Promise<AuthActionResponse> {
    const result = await this.authService.linkGoogle(userId, data);

    return ResponseFactory.success({
      data: result,
      code: HttpStatus.OK,
      message: ValidMessageResponse.UPDATED,
    });
  }

  @Post('verify-password')
  @UseGuards(AtGuard)
  @ApiOperation({ summary: 'Verify current user password to view login info' })
  @ApiResponse({ status: 200, description: 'Password verified successfully' })
  @ApiResponse({ status: 401, description: 'Password incorrect' })
  async verifyPassword(
    @GetCurrentUserId() userId: string,
    @Body() data: VerifyPasswordDto,
  ): Promise<AuthLoginInfoResponse> {
    const result = await this.authService.verifyPassword(userId, data);

    return ResponseFactory.success({
      data: result,
      code: HttpStatus.OK,
      message: ValidMessageResponse.GETTED,
    });
  }

  @Post('verify-google')
  @UseGuards(AtGuard)
  @ApiOperation({
    summary: 'Verify current user google account to view login info',
  })
  @ApiResponse({
    status: 200,
    description: 'Google account verified successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async verifyGoogle(
    @GetCurrentUserId() userId: string,
    @Body() data: VerifyGoogleDto,
  ): Promise<AuthLoginInfoResponse> {
    const result = await this.authService.verifyGoogle(userId, data);

    return ResponseFactory.success({
      data: result,
      code: HttpStatus.OK,
      message: ValidMessageResponse.GETTED,
    });
  }

  @Delete('account')
  @UseGuards(AtGuard)
  @ApiOperation({ summary: 'Delete current user account permanently' })
  @ApiResponse({
    status: 200,
    description: 'Account deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized or wrong password' })
  async deleteAccount(
    @GetCurrentUserId() userId: string,
    @Body() data: DeleteAccountDto,
  ): Promise<AuthStatusResponse> {
    const result = await this.authService.deleteAccount(userId, data);

    return ResponseFactory.success({
      data: result,
      code: HttpStatus.OK,
      message: ValidMessageResponse.DELETED,
    });
  }

  @Post('logout')
  @UseGuards(RtGuard)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async logout(
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('refreshToken') refreshToken: string,
  ): Promise<AuthStatusResponse> {
    const user = await this.authService.logout(userId, refreshToken);

    return ResponseFactory.success({
      data: user,
      code: HttpStatus.OK,
      message: ValidMessageResponse.LOGIN,
    });
  }
}
