import { Injectable } from '@nestjs/common';

export interface College {
  id: number;
  name: string;
  code: string;
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  status: 'active' | 'inactive' | 'suspended';
  studentLimit: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class CollegesRepository {
  private colleges: College[] = [
    // ── Existing colleges ──────────────────────────────────────────────
    {
      id: 1,
      name: 'IIIT Sri City',
      code: 'IIITSRICITY',
      email: 'admin@iiitsricity.ac.in',
      phone: '+91 8626 252525',
      address: 'Chittoor, Andhra Pradesh',
      website: 'https://iiits.ac.in',
      status: 'active',
      studentLimit: 99999,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: 2,
      name: 'VIT University',
      code: 'VIT',
      email: 'admin@vit.ac.in',
      phone: '+91 416 2202020',
      address: 'Vellore, Tamil Nadu',
      website: 'https://vit.ac.in',
      status: 'active',
      studentLimit: 99999,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: 3,
      name: 'SRM Institute',
      code: 'SRM',
      email: 'admin@srm.edu.in',
      phone: '+91 44 27417000',
      address: 'Kattankulathur, Tamil Nadu',
      website: 'https://srmist.edu.in',
      status: 'active',
      studentLimit: 500,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: 4,
      name: 'BITS Pilani',
      code: 'BITS',
      email: 'admin@bits-pilani.ac.in',
      phone: '+91 1596 242192',
      address: 'Pilani, Rajasthan',
      website: 'https://www.bits-pilani.ac.in',
      status: 'active',
      studentLimit: 99999,
      createdAt: '2024-03-01',
      updatedAt: '2024-03-01',
    },
    {
      id: 5,
      name: 'Manipal Institute of Technology',
      code: 'MIT',
      email: 'admin@manipal.edu',
      phone: '+91 820 2922222',
      address: 'Manipal, Karnataka',
      website: 'https://manipal.edu',
      status: 'active',
      studentLimit: 500,
      createdAt: '2024-04-01',
      updatedAt: '2024-04-01',
    },
    {
      id: 6,
      name: 'Amity University',
      code: 'AMITY',
      email: 'admin@amity.edu',
      phone: '+91 120 4392000',
      address: 'Noida, Uttar Pradesh',
      website: 'https://amity.edu',
      status: 'inactive',
      studentLimit: 200,
      createdAt: '2024-02-15',
      updatedAt: '2024-06-01',
    },
  ];

  private nextId = 10;

  findAll(): College[] {
    return this.colleges;
  }

  findById(id: number): College | undefined {
    return this.colleges.find(c => c.id === id);
  }

  findByCode(code: string): College | undefined {
    return this.colleges.find(c => c.code === code);
  }

  create(data: Omit<College, 'id'>): College {
    const college: College = { id: this.nextId++, ...data };
    this.colleges.push(college);
    return college;
  }

  update(id: number, data: Partial<College>): College | undefined {
    const idx = this.colleges.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    this.colleges[idx] = {
      ...this.colleges[idx],
      ...data,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    return this.colleges[idx];
  }

  remove(id: number): boolean {
    const idx = this.colleges.findIndex(c => c.id === id);
    if (idx === -1) return false;
    this.colleges.splice(idx, 1);
    return true;
  }
}
