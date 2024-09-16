import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { Public } from '@/decorator/customize';
import { CreateAuthDto } from './dto/create-auth.dto';
import { MailerService } from '@nestjs-modules/mailer';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private mailerService: MailerService,
  ) {}

  // @Post('login')
  // signIn(@Body() authDto: AuthDto) {
  //   return this.authService.signIn(authDto.username, authDto.password);
  // }
  @UseGuards(LocalAuthGuard)
  @Public()
  @Post('login')
  handleLogin(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('register')
  @Public()
  register(@Body() registerDto: CreateAuthDto) {
    return this.authService.handleRegister(registerDto);
  }

  @Get('test-mail')
  @Public()
  testMail() {
    this.mailerService
      .sendMail({
        to: 'datpt2@yy6xg.onmicrosoft.com', // list of receivers
        from: 'noreply@nestjs.com', // sender address
        subject: 'Testing Nest MailerModule ✔', // Subject line
        text: 'welcome', // plaintext body
        html: '<b>Hello world!</b>', // HTML body content
      })
      .then(() => {})
      .catch((err) => {
        console.log(err);
      });
    return 'ok';
  }
}
