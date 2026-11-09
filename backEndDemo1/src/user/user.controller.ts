import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
// import type { User } from './user.service';
import { User } from './user.entity';
import { UserService } from './user.service';
import { RoleGuard } from 'src/guards/role.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService){}
    @Get()
    async getUsers(@Query('name') name: string): Promise<User[]> {
        return await this.userService.findAllUsers(name);
    }
    @Get('me')
    @UseGuards(JwtAuthGuard) //get the request user information 
    async getProfile(@Req() req: any) {
        return req.user;
    }
    @Get(':id')
    async getUserById(@Param('id', ParseIntPipe) id: number): Promise<User> {
        const user = await this.userService.findOneUser(id);
        if (!user){
            throw new NotFoundException('User is not found!');
        }
        return user;

    }
    @Post()
    async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
        return await this.userService.createUser(createUserDto);
    }

    @Put()
    @UseGuards(JwtAuthGuard)
    async updateUser(@Req() req: any, @Body() updateUserDto: UpdateUserDto): Promise<User>{
        return await this.userService.updateUser(req.user.sub ,updateUserDto);
    }
    // async updateUser(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto): Promise<User>{
    //     return await this.userService.updateUser(id,updateUserDto);
    // }
    @Delete(':id')
    @UseGuards(RoleGuard)
    async deleteUser(@Param('id', ParseIntPipe) id: number){
        return await this.userService.deleteUser(id);
    }
}
    