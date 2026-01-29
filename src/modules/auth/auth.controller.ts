import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Res,
  Query,
  UnauthorizedException,
  Body,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedRequest } from './interfaces/auth.interface';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubAuth() {
    // Guard redirects to GitHub
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Query('state') state?: string,
  ) {
    const user = req.user;
    const tokens = this.authService.generateTokens(user.id, user.email);

    // Update user object in response with full details
    const fullUser = await this.authService.getMe(user.id);
    tokens.user = {
      id: fullUser.id,
      email: fullUser.email,
      name: fullUser.name,
      avatar: fullUser.avatar,
    };

    // Redirect to frontend with tokens
    const redirectUrl = state || this.configService.get<string>('APP_URL') || 'http://localhost:3000';
    const frontendUrl = new URL('/auth/callback', redirectUrl);
    frontendUrl.searchParams.set('accessToken', tokens.accessToken);
    frontendUrl.searchParams.set('refreshToken', tokens.refreshToken);

    return res.redirect(frontendUrl.toString());
  }

  @Post('refresh')
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    if (!refreshTokenDto.refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }
}
