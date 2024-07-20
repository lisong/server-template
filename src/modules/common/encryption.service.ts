import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly saltRounds = 10;

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async generatePassword(): Promise<string> {
    // 生成随机的 12 字节 Buffer
    const buffer = crypto.randomBytes(12);
    // 将 Buffer 转换为 Base64 编码字符串
    const base64String = buffer.toString('base64');
    return base64String;
  }
}
