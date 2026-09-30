import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsService } from './questions.service';

describe('QuestionsService', () => {
  let service: QuestionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestionsService],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
  });

  it('should load default 16 questions and secret image data', () => {
    const questions = service.getDefaultQuestions();
    expect(questions.length).toBe(16);
    expect(questions[0]).toHaveProperty('text');
    expect(questions[0].options.length).toBe(4);
    expect(questions[0].correctIndex).toBeGreaterThanOrEqual(0);
    expect(questions[0].correctIndex).toBeLessThanOrEqual(3);

    const media = service.getSecretMedia();
    expect(media.keyword).toBeDefined();
    expect(media.imageUrl).toBeDefined();
  });

  it('should validate question structure properly', () => {
    const valid = service.validateQuestion({
      id: 'test-1',
      text: 'Câu hỏi test?',
      options: ['A', 'B', 'C', 'D'],
      correctIndex: 1,
    });
    expect(valid).toBe(true);

    const invalid = service.validateQuestion({
      id: 'test-2',
      text: '',
      options: ['A', 'B'],
      correctIndex: 5,
    });
    expect(invalid).toBe(false);
  });

  it('should update secret keyword and image', () => {
    service.updateSecretMedia('Phố cổ Hội An', '/images/hoi_an.jpg');
    const media = service.getSecretMedia();
    expect(media.keyword).toBe('Phố cổ Hội An');
    expect(media.imageUrl).toBe('/images/hoi_an.jpg');
  });

  it('should validate and set custom game config with 16 questions and secret media', () => {
    const customQuestions = Array.from({ length: 16 }, (_, i) => ({
      id: `custom-q-${i + 1}`,
      text: `Câu hỏi số ${i + 1}`,
      options: ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D'],
      correctIndex: i % 4,
    }));

    const validConfig = {
      secretMedia: {
        keyword: 'Chùa Hương',
        imageUrl: 'https://example.com/chua-huong.jpg',
        hint: 'Khu danh thắng nổi tiếng ở Hà Nội',
      },
      questions: customQuestions,
    };

    expect(service.validateCustomGameConfig(validConfig)).toBe(true);
    service.setCustomGame(validConfig);

    expect(service.getSecretMedia().keyword).toBe('Chùa Hương');
    expect(service.getDefaultQuestions()[0].text).toBe('Câu hỏi số 1');

    // Invalid config with only 10 questions
    const invalidConfig = {
      secretMedia: { keyword: '', imageUrl: '' },
      questions: customQuestions.slice(0, 10),
    };
    expect(service.validateCustomGameConfig(invalidConfig)).toBe(false);
  });
});

