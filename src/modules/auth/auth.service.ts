import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. Try DB user if Prisma is connected
    if (this.prisma.isConnected) {
      try {
        const user = await this.prisma.adminUser.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (user) {
          const isMatch = await bcrypt.compare(password, user.password_hash);
          if (isMatch) {
            return this.generateAuthResponse(user.id, user.email, user.name || 'Admin', user.role);
          }
        }
      } catch (err) {
        this.logger.warn(`Prisma admin login query error: ${err.message}`);
      }
    }

    // 2. Check environment fallback admin credentials
    const defaultEmail = (
      this.configService.get<string>('ADMIN_DEFAULT_EMAIL') || 'admin@scholarbean.com'
    ).toLowerCase();
    const defaultPassword =
      this.configService.get<string>('ADMIN_DEFAULT_PASSWORD') || 'AdminScholarBean2026!';

    if (email.toLowerCase() === defaultEmail && password === defaultPassword) {
      return this.generateAuthResponse(
        'admin-default-id',
        defaultEmail,
        'ScholarBean SuperAdmin',
        'ADMIN',
      );
    }

    throw new UnauthorizedException('Invalid email or password.');
  }

  private generateAuthResponse(
    id: string,
    email: string,
    name: string,
    role: string,
  ) {
    const payload = { sub: id, email, role };
    const accessToken = this.jwtService.sign(payload);

    return {
      success: true,
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 86400, // 24 hours in seconds
      user: {
        id,
        email,
        name,
        role,
      },
    };
  }
}
