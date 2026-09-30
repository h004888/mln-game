import { Injectable } from '@nestjs/common';
import { Question } from '../game/game.types';
import { SecretMedia } from './questions.types';

@Injectable()
export class QuestionsService {
  private secretMedia: SecretMedia = {
    keyword: 'Vịnh Hạ Long',
    imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
    hint: 'Di sản thiên nhiên thế giới nổi tiếng với hàng nghìn đảo đá vôi kỳ vĩ.',
  };

  private defaultQuestions: Question[] = [
    { id: 'q1', text: 'Thủ đô của Việt Nam là thành phố nào?', options: ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Huế'], correctIndex: 0 },
    { id: 'q2', text: 'Đỉnh núi nào được mệnh danh là "Nóc nhà Đông Dương"?', options: ['Bạch Mộc Lương Tử', 'Fansipan', 'Pu Si Lung', 'Tây Côn Lĩnh'], correctIndex: 1 },
    { id: 'q3', text: 'Vịnh biển nào của Việt Nam 2 lần được UNESCO công nhận là Di sản thiên nhiên thế giới?', options: ['Vịnh Nha Trang', 'Vịnh Xuân Đài', 'Vịnh Hạ Long', 'Vịnh Lan Hạ'], correctIndex: 2 },
    { id: 'q4', text: 'Dòng sông nào dài nhất chảy qua lãnh thổ Việt Nam?', options: ['Sông Hồng', 'Sông Đồng Nai', 'Sông Cửu Long', 'Sông Mê Kông'], correctIndex: 2 },
    { id: 'q5', text: 'Ngày Quốc khánh của nước CHXHCN Việt Nam là ngày nào?', options: ['30/4', '2/9', '1/5', '19/8'], correctIndex: 1 },
    { id: 'q6', text: 'Đơn vị tiền tệ chính thức của Việt Nam là?', options: ['USD', 'Yên', 'Đồng', 'Baht'], correctIndex: 2 },
    { id: 'q7', text: 'Trang phục truyền thống nổi tiếng thế giới của phụ nữ Việt Nam là?', options: ['Áo dài', 'Kimono', 'Hanbok', 'Sari'], correctIndex: 0 },
    { id: 'q8', text: 'Không gian văn hóa Cồng chiêng được UNESCO vinh danh thuộc vùng nào?', options: ['Tây Nguyên', 'Đồng bằng Bắc Bộ', 'Đông Nam Bộ', 'Tây Nam Bộ'], correctIndex: 0 },
    { id: 'q9', text: 'Tết Nguyên Đán theo âm lịch mở đầu cho mùa nào trong năm?', options: ['Mùa Hạ', 'Mùa Thu', 'Mùa Đông', 'Mùa Xuân'], correctIndex: 3 },
    { id: 'q10', text: 'Cây cầu quay đầu tiên tại Việt Nam nằm ở thành phố nào?', options: ['Hải Phòng', 'Đà Nẵng', 'Cần Thơ', 'TP. Hồ Chí Minh'], correctIndex: 1 },
    { id: 'q11', text: 'Di tích lịch sử Địa đạo Củ Chi thuộc tỉnh/thành phố nào?', options: ['Tây Ninh', 'Bình Dương', 'TP. Hồ Chí Minh', 'Đồng Nai'], correctIndex: 2 },
    { id: 'q12', text: 'Chùa Một Cột ở Hà Nội có kiến trúc mô phỏng hình tượng loài hoa nào?', options: ['Hoa Sen', 'Hoa Mai', 'Hoa Đào', 'Hoa Cúc'], correctIndex: 0 },
    { id: 'q13', text: 'Hồ nước ngọt tự nhiên lớn nhất Việt Nam là hồ nào?', options: ['Hồ Tây', 'Hồ Ba Bể', 'Hồ Tơ Nưng', 'Hồ Trị An'], correctIndex: 1 },
    { id: 'q14', text: 'Hai quần đảo Hoàng Sa và Trường Sa thuộc chủ quyền thiêng liêng của nước nào?', options: ['Việt Nam', 'Thái Lan', 'Malaysia', 'Philippines'], correctIndex: 0 },
    { id: 'q15', text: 'Món bánh truyền thống hình vuông tượng trưng cho đất trong ngày Tết là gì?', options: ['Bánh tét', 'Bánh chưng', 'Bánh giầy', 'Bánh gai'], correctIndex: 1 },
    { id: 'q16', text: 'Đại thi hào Nguyễn Du là tác giả của kiệt tác văn học nào?', options: ['Lục Vân Tiên', 'Truyện Kiều', 'Tắt Đèn', 'Chí Phèo'], correctIndex: 1 },
  ];

  getDefaultQuestions(): Question[] {
    return this.defaultQuestions.map((q) => ({
      ...q,
      options: [...q.options],
    }));
  }

  getSecretMedia(): SecretMedia {
    return { ...this.secretMedia };
  }

  updateSecretMedia(keyword: string, imageUrl: string, hint?: string) {
    if (keyword && keyword.trim()) this.secretMedia.keyword = keyword.trim();
    if (imageUrl && imageUrl.trim()) this.secretMedia.imageUrl = imageUrl.trim();
    if (hint && hint.trim()) this.secretMedia.hint = hint.trim();
  }

  validateQuestion(q: Partial<Question>): boolean {
    if (!q || !q.text || typeof q.text !== 'string' || q.text.trim().length === 0) {
      return false;
    }
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      return false;
    }
    if (q.options.some((opt) => typeof opt !== 'string' || opt.trim().length === 0)) {
      return false;
    }
    if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3) {
      return false;
    }
    return true;
  }

  validateCustomGameConfig(config: any): boolean {
    if (!config || typeof config !== 'object') {
      return false;
    }
    if (
      !config.secretMedia ||
      typeof config.secretMedia.keyword !== 'string' ||
      config.secretMedia.keyword.trim().length === 0 ||
      typeof config.secretMedia.imageUrl !== 'string' ||
      config.secretMedia.imageUrl.trim().length === 0
    ) {
      return false;
    }
    if (!Array.isArray(config.questions) || config.questions.length !== 16) {
      return false;
    }
    return config.questions.every((q: any) => this.validateQuestion(q));
  }

  setCustomGame(config: { secretMedia: SecretMedia; questions: Question[] }) {
    if (!this.validateCustomGameConfig(config)) {
      throw new Error('Invalid custom game configuration');
    }
    this.updateSecretMedia(config.secretMedia.keyword, config.secretMedia.imageUrl, config.secretMedia.hint);
    this.defaultQuestions = config.questions.map((q, idx) => ({
      ...q,
      options: [...q.options],
      id: q.id || `custom-q-${idx + 1}`,
    }));
  }
}
