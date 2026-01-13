import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { MemberDto } from './dto/create-members.dto';
import { CloudinaryService } from 'src/common/config/cloudinary/cloudinary.service';
import { EnvConfigService } from 'src/common/config/env/env-config.service';
import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

@Injectable()
export class MemberService {
  constructor(
    private prisma: PrismaService,
    private coudinarySerive: CloudinaryService,
    private envConfig: EnvConfigService,
  ) {}
  async create(data: MemberDto, file?: Express.Multer.File) {
    let avatarUrl: string = '';
    if (file) {
      const upload: UploadApiResponse | UploadApiErrorResponse =
        await this.coudinarySerive.uploadFile(
          file,
          this.envConfig.folderFamilyName,
        );

      if (upload.secure_url) avatarUrl = upload.secure_url as string;
    }

    const newMember = await this.prisma.familyMember.create({
      data: {
        ...data,
        avatarUrl: avatarUrl,
      },
      select: {
        id: true,
        fullName: true,
        generation: true,
        isAlive: true,
        avatarUrl: true,
      },
    });

    return newMember;
  }
}
