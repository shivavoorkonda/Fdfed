import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CollegesRepository, College } from './colleges.repository';
import { CreateCollegeDto } from './dto/create-college.dto';
import { UpdateCollegeDto } from './dto/update-college.dto';

@Injectable()
export class CollegesService {
  constructor(private readonly repo: CollegesRepository) {}

  findAll(): College[] {
    return this.repo.findAll();
  }

  findOne(id: number): College {
    const college = this.repo.findById(id);
    if (!college) throw new NotFoundException(`College with id ${id} not found`);
    return college;
  }

  create(dto: CreateCollegeDto): College {
    const existing = this.repo.findByCode(dto.code);
    if (existing) throw new ConflictException(`College with code '${dto.code}' already exists`);
    const all = this.repo.findAll();
    if (all.some((c) => c.name.trim().toLowerCase() === dto.name.trim().toLowerCase())) {
      throw new ConflictException(`A college named '${dto.name}' already exists`);
    }
    if (all.some((c) => c.email.toLowerCase() === dto.email.toLowerCase())) {
      throw new ConflictException(`A college with email '${dto.email}' already exists`);
    }
    const now = new Date().toISOString().split('T')[0];
    return this.repo.create({
      ...dto,
      status:           dto.status ?? 'active',
      studentLimit:     (dto as any).studentLimit      ?? 200,
      createdAt: now,
      updatedAt: now,
    });
  }

  update(id: number, dto: UpdateCollegeDto): College {
    if (!this.repo.findById(id)) throw new NotFoundException(`College with id ${id} not found`);
    const all = this.repo.findAll().filter((college) => college.id !== id);
    if (dto.code && all.some((college) => college.code.toLowerCase() === dto.code!.toLowerCase())) {
      throw new ConflictException(`College code '${dto.code}' is already in use`);
    }
    if (dto.name && all.some((college) => college.name.trim().toLowerCase() === dto.name!.trim().toLowerCase())) {
      throw new ConflictException(`A college named '${dto.name}' already exists`);
    }
    if (dto.email && all.some((college) => college.email.toLowerCase() === dto.email!.toLowerCase())) {
      throw new ConflictException(`A college with email '${dto.email}' already exists`);
    }
    const updated = this.repo.update(id, dto as Partial<College>);
    if (!updated) throw new NotFoundException(`College with id ${id} not found`);
    return updated;
  }

  updateStatus(id: number, status: 'active' | 'inactive' | 'suspended'): College {
    const updated = this.repo.update(id, { status });
    if (!updated) throw new NotFoundException(`College with id ${id} not found`);
    return updated;
  }

  remove(id: number): { message: string } {
    const removed = this.repo.remove(id);
    if (!removed) throw new NotFoundException(`College with id ${id} not found`);
    return { message: `College ${id} deleted` };
  }
}
