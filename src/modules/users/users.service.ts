import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { hashPasswordHelper } from '@/helpers/util';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import aqp from 'api-query-params';
import { CreateAuthDto } from '@/auth/dto/create-auth.dto';
import { v4 as uuid } from 'uuid';
import dayjs from 'dayjs';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private mailerService: MailerService,
  ) {}

  async handleRegister(registerDto: CreateAuthDto) {
    const { email, name, password } = registerDto;
    //check email exist
    const isExist = await this.isEmailExist(email);
    if (isExist) {
      throw new BadRequestException(`Email existed: ${email}`);
    }

    //hashPassword
    const hashPassword = await hashPasswordHelper(password);
    const codeId = uuid();
    const user = await this.userModel.create({
      name,
      email,
      password: hashPassword,
      isActive: false,
      codeExpired: dayjs().add(5, 'minutes'),
      codeId,
    });

    //send email
    this.mailerService.sendMail({
      to: user.email, // list of receivers
      from: 'noreply@nestjs.com', // sender address
      subject: 'Activate your account', // Subject line
      template: 'register', // HTML body content
      context: {
        name: user.name ?? user.email,
        activationCode: codeId,
      },
    });
    //response

    return {
      _id: user._id,
    };
  }

  async findByEmail(email: string) {
    return await this.userModel.findOne({ email });
  }

  async isEmailExist(email: string) {
    const user = await this.userModel.exists({ email });
    if (user) {
      return true;
    }
    return false;
  }

  async create(createUserDto: CreateUserDto) {
    const { name, email, password, address, phone, image } = createUserDto;
    //check email exist
    const isExist = await this.isEmailExist(email);
    if (isExist) {
      throw new BadRequestException(`Email existed: ${email}`);
    }

    //hash password
    const hashPassword = await hashPasswordHelper(password);
    const user = await this.userModel.create({
      name,
      email,
      password: hashPassword,
      phone,
      address,
      image,
    });
    return {
      _id: user._id,
    };
  }

  async findAll(query: string, current: number, pageSize: number) {
    const { filter, sort } = aqp(query);
    if (filter.current) delete filter.current;
    if (filter.pageSize) delete filter.pageSize;
    if (!current) current = 1;
    if (!pageSize) pageSize = 10;

    const totalItems = (await this.userModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const skip = (current - 1) * pageSize;

    const results = await this.userModel
      .find(filter)
      .limit(pageSize)
      .skip(skip)
      .select('-password')
      .sort(sort as any);
    return {
      results,
      totalPages,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async update(updateUserDto: UpdateUserDto) {
    return await this.userModel.updateOne(
      { _id: updateUserDto._id },
      { ...updateUserDto },
    );
  }

  async remove(_id: string) {
    //check valid id
    if (!mongoose.isValidObjectId(_id)) {
      throw new BadRequestException('Invalid id');
    }

    return await this.userModel.deleteOne({ _id });
  }
}
