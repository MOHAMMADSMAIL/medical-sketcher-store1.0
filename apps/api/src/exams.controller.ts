import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from './prisma.service';
import { AuthGuard } from './auth.guard';
import { Roles, RolesGuard } from './roles.guard';

const SKILLS = ['LISTENING', 'READING', 'SPEAKING'];

/**
 * Exam system for the Listening / Reading / Speaking home sections.
 * Content is authored by the owner against a source book (uploaded later);
 * customers see one published exam per skill and can submit attempts.
 * Audio (Listening) accepts an uploaded media id now; TTS wiring is a
 * deliberate later integration, not part of this schema.
 */
@Controller('exams')
export class ExamsController {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Public: one published exam per skill, metadata only (no answer key) ----

  @Get()
  async bySkill(@Query('skill') skill?: string) {
    const where: any = { status: 'PUBLISHED' };
    if (skill) {
      if (!SKILLS.includes(skill)) throw new BadRequestException(`skill must be one of ${SKILLS.join(', ')}`);
      where.skill = skill;
    }
    const exams = await this.prisma.assessment.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, title: true, slug: true, skill: true, level: true, language: true,
        passScore: true, sourceProductId: true, updatedAt: true,
        sourceProduct: { select: { id: true, title: true, slug: true, type: true } },
      },
    });
    return exams;
  }

  @Get(':id')
  async take(@Param('id') id: string) {
    const exam = await this.prisma.assessment.findFirst({
      where: { id, status: 'PUBLISHED' },
      include: { audioMedia: { select: { id: true, mimeType: true } }, sourceProduct: { select: { id: true, title: true, slug: true } } },
    });
    if (!exam) throw new NotFoundException('Exam not found');
    // Strip anything that would leak the answer key when questions carry one.
    const questions = Array.isArray(exam.questions) ? (exam.questions as any[]).map((q) => ({ prompt: q.prompt, options: q.options, id: q.id })) : [];
    return { ...exam, questions, answerKey: undefined, audioMedia: exam.audioMedia ? { id: exam.audioMedia.id, url: `/api/products/media/${exam.audioMedia.id}`, mimeType: exam.audioMedia.mimeType } : null };
  }

  @UseGuards(AuthGuard)
  @Post(':id/attempts')
  async submitAttempt(@Req() req: Request & { user: { id: string } }, @Param('id') id: string, @Body() body: { answers?: unknown }) {
    const exam = await this.prisma.assessment.findFirst({ where: { id, status: 'PUBLISHED' } });
    if (!exam) throw new NotFoundException('Exam not found');
    const questions = Array.isArray(exam.questions) ? (exam.questions as any[]) : [];
    const answers = Array.isArray(body?.answers) ? (body.answers as any[]) : [];
    // Server-side scoring only: the client never receives the answer key.
    let correct = 0;
    for (const q of questions) {
      const given = answers.find((a) => a?.id === q.id)?.answer;
      if (given !== undefined && String(given) === String(q.answer)) correct += 1;
    }
    const score = questions.length ? Math.round((correct / questions.length) * 100) : null;
    const passed = score === null ? null : score >= exam.passScore;
    const attempt = await this.prisma.examAttempt.create({
      data: { assessmentId: exam.id, userId: req.user.id, answers: answers as any, score, passed },
    });
    return { id: attempt.id, score, passed, passScore: exam.passScore, correct, total: questions.length };
  }

  // ---- Owner authoring ----

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @Post('admin')
  async createExam(@Req() req: Request & { user: { id: string } }, @Body() body: Record<string, any>) {
    if (body.skill && !SKILLS.includes(body.skill)) throw new BadRequestException(`skill must be one of ${SKILLS.join(', ')}`);
    if (body.sourceProductId) {
      const product = await this.prisma.product.findUnique({ where: { id: body.sourceProductId } });
      if (!product) throw new NotFoundException('Source product not found');
    }
    if (body.audioMediaId) {
      const media = await this.prisma.media.findUnique({ where: { id: body.audioMediaId } });
      if (!media) throw new NotFoundException('Audio media not found');
    }
    const exam = await this.prisma.assessment.create({
      data: {
        title: String(body.title || 'Untitled exam'),
        slug: String(body.slug || `exam-${Date.now()}`).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        questions: (body.questions ?? []) as any,
        passScore: Number(body.passScore) || 70,
        status: body.status || 'DRAFT',
        skill: body.skill || null,
        level: body.level || null,
        sourceProductId: body.sourceProductId || null,
        language: body.language || 'de',
        audioMediaId: body.audioMediaId || null,
      },
    });
    await this.prisma.auditLog.create({ data: { userId: req.user.id, action: 'create', entity: 'Assessment', entityId: exam.id, metadata: { title: exam.title, skill: exam.skill } as any } });
    return exam;
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @Post('admin/:id')
  async updateExam(@Req() req: Request & { user: { id: string } }, @Param('id') id: string, @Body() body: Record<string, any>) {
    const existing = await this.prisma.assessment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Exam not found');
    if (body.skill && !SKILLS.includes(body.skill)) throw new BadRequestException(`skill must be one of ${SKILLS.join(', ')}`);
    const data: Record<string, any> = {};
    for (const key of ['title', 'slug', 'questions', 'passScore', 'status', 'skill', 'level', 'sourceProductId', 'language', 'audioMediaId']) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    const exam = await this.prisma.assessment.update({ where: { id }, data: data as any });
    await this.prisma.auditLog.create({ data: { userId: req.user.id, action: 'update', entity: 'Assessment', entityId: exam.id, metadata: { title: exam.title } as any } });
    return exam;
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @Get('admin/list')
  async adminList() {
    return this.prisma.assessment.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { sourceProduct: { select: { title: true, slug: true } }, _count: { select: { attempts: true } } },
    });
  }
}
