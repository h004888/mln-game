import { Body, Controller, Get, Post } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { Question } from '../game/game.types';
import { SecretMedia } from './questions.types';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  getQuestions(): Question[] {
    return this.questionsService.getDefaultQuestions();
  }

  @Get('media')
  getSecretMedia(): SecretMedia {
    return this.questionsService.getSecretMedia();
  }

  @Post('media')
  updateSecretMedia(@Body() body: { keyword: string; imageUrl: string; hint?: string }): { success: boolean } {
    this.questionsService.updateSecretMedia(body.keyword, body.imageUrl, body.hint);
    return { success: true };
  }

  @Get('custom-game')
  getCustomGame() {
    return {
      secretMedia: this.questionsService.getSecretMedia(),
      questions: this.questionsService.getDefaultQuestions(),
    };
  }

  @Post('custom-game')
  setCustomGame(@Body() body: any): { success: boolean; message?: string } {
    try {
      this.questionsService.setCustomGame(body);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
}
