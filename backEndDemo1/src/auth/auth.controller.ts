import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './auth.constants';
import { IsString } from 'class-validator';

class RefreshTokenDto {
  @IsString()
  refresh_token!: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Body() body: RefreshTokenDto) {
    const payload = await this.jwtService.verifyAsync<{ sub: number }>(body.refresh_token, {
      secret: jwtConstants.refreshSecret,
    });

    return this.authService.refreshTokens(payload.sub, body.refresh_token);
  }
}


//   @UseGuards(JwtAuthGuard)
//   @Get('profile')
//   getProfile(@Request() request: { user: unknown }) {
//     return request.user;
//   }
// }