import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ unique: true})
    email!: string;

    @Column({ select: false })
    password!: string;

    @Column({ type: 'text', nullable: true, select: false }) // have to define type because its an union (string or null)
    refreshToken!: string | null;
}