// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
// import { compare } from 'bcryptjs';
// import { UserService } from '../user/user.service';
// import { LoginDto } from './dto/login.dto';
// import { RegisterDto } from './dto/register.dto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { compare, hash } from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './auth.constants';
import { User } from '../user/user.entity';

type AuthTokens = {
  access_token: string;
  refresh_token: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService
  ) {}

  async register(dto: CreateUserDto) {
    const hashed = await hash(dto.password, 10);
    const createDto = { ...dto, password: hashed };
    const user = await this.userService.createUser(createDto as CreateUserDto); // as -> type inserting
    const tokens = await this.getTokens(user);
    await this.userService.setCurrentRefreshToken(user.id, await hash(tokens.refresh_token, 10));

    const { password, refreshToken, ...safe } = user as User & { refreshToken?: string | null }; // safe is feature called rest property, takes everything out of user object instead of pw and token
    return { user: safe, ...tokens };
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.userService.findByEmailWithPassword(dto.email);
        if (!user) {
          throw new UnauthorizedException('Email Not Found');
        }
        const isPasswordValid = await compare(dto.password, user?.password);
        if (!isPasswordValid) {
          throw new UnauthorizedException('Invalid password');
        }
        const tokens = await this.getTokens(user);
        await this.userService.setCurrentRefreshToken(user.id, await hash(tokens.refresh_token, 10));

        return tokens;
      }

  async refreshTokens(userId: number, refreshToken: string): Promise<AuthTokens> {
    const user = await this.userService.findByIdWithRefreshToken(userId);

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const refreshTokenMatches = await compare(refreshToken, user.refreshToken);
    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.getTokens(user);
    await this.userService.setCurrentRefreshToken(user.id, await hash(tokens.refresh_token, 10));

    return tokens;
  }

  private async getTokens(user: Pick<User, 'id' | 'email' | 'name'>): Promise<AuthTokens> {
    const payload = { id: user.id, email: user.email, name: user.name };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtConstants.secret,
        expiresIn: '1h',
      }),
      this.jwtService.signAsync(payload, {
        secret: jwtConstants.refreshSecret,
        expiresIn: '7d',
      }),
    ]);

    return { access_token, refresh_token };
  }

}



//   private createAuthResponse(user: { id: number; email: string; name: string }) {
//     const payload = { sub: user.id, email: user.email, name: user.name };

//     return {
//       accessToken: this.jwtService.sign(payload),
//       user,
//     };
//   }
// }