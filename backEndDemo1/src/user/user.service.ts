import { Injectable, NotFoundException } from '@nestjs/common';
import { LoggerService } from './user.logger';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { ILike, Repository } from 'typeorm';

// export interface User {
//     id: number;
//     name: string;
//     email: string;
// }
@Injectable()
export class UserService {
    constructor(private readonly logger:LoggerService,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {}

    async findByEmail(email: string): Promise<User | null> {
            return this.userRepository.findOne({ where: { email } });
        }

    // This method explicitly selects the password field (hidden by default)
    async findByEmailWithPassword(email: string): Promise<User | null> {
        return this.userRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            // .addSelect('user.refreshToken')
            .where('user.email = :email', { email })
            .getOne();
    }

    async findByIdWithRefreshToken(id: number): Promise<User | null> {
        return this.userRepository
            .createQueryBuilder('user')
            .addSelect('user.refreshToken')
            .where('user.id = :id', { id })
            .getOne();
    }

    async setCurrentRefreshToken(userId: number, refreshToken: string | null): Promise<void> {
        await this.userRepository.update(userId, { refreshToken });
    }
    async userExistCheck(id: number): Promise<User>{
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }
    async findAllUsers(name: string): Promise<User[]>{
        if (!name) return this.userRepository.find();
        return this.userRepository.find({ where: { name: ILike(`%${name}%`)}});
    }

    async findOneUser(id: number): Promise<User | null>{
        return (await this.userRepository.findOneBy({ id }));
    }

    async createUser(dto: CreateUserDto): Promise<User> {
        const newUser = this.userRepository.create(dto);
        return this.userRepository.save(newUser);
    }

    async updateUser(id: number, dto: UpdateUserDto): Promise<User>{
        const user = await this.userExistCheck(id);
        const updateUser = await this.userRepository.merge( user, dto)
        return this.userRepository.save( updateUser );
    }

    async deleteUser(id: number): Promise<void>{
        const user = await this.userExistCheck(id);
        this.userRepository.remove(user);
    }
}
