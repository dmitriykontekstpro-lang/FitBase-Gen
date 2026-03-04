import express from 'express';
import { createServer as createViteServer } from 'vite';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.post('/api/generate', async (req, res) => {
    try {
      const { premise, title, text, fileContent, imageBase64 } = req.body;

      const fitbaseInfo = `Обзор продукта: FitBase (CRM для фитнес-индустрии)
1. Суть и позиционирование
Что это: Облачная CRM-система для управления фитнес-клубами, студиями, школами танцев и спортивными секциями.

Статус: Резидент Сколково, сертификат Минцифры, соответствие ФЗ-54 и ФЗ-152.

Главная ценность: Автоматизация рутины, рост прибыли через удержание клиентов и прозрачная аналитика.

2. Основные функциональные блоки
CRM и Продажи:
Единая канбан-доска для лидов из всех каналов (сайт, мессенджеры, соцсети).
Автоматические задачи для менеджеров и контроль воронки продаж.
Интеграция с IP-телефонией (запись звонков, статистика).

Учет и Клиентский сервис:
База клиентов с историей посещений, оплат и коммуникаций.
Управление абонементами, пакетами услуг и рекуррентными платежами (подписочная модель).
Удаленное подписание договоров через SMS.

Расписание и Запись:
Онлайн-расписание и виджет записи для сайта/соцсетей.
Лист ожидания с автоуведомлениями при освобождении мест.

Маркетинг и Лояльность:
Интегрированный чат: WhatsApp, Telegram, VK в одном окне.
Триггерные и массовые рассылки (push, мессенджеры).
Программы лояльности: бонусы, кешбэк, реферальная система «Приведи друга», геймификация.

3. Технологические особенности
Мобильные приложения: Отдельные решения для клиентов (запись, оплата, QR-вход) и для тренеров (отметки, графики).
Автоматизация доступа (СКУД): Вход по QR-коду, управление турникетами и замками шкафчиков.
Финансы и HR: Авторасчет зарплат тренеров, онлайн-кассы, интеграция с CloudPayments (СБП, карты).

4. Конкурентные преимущества (USP)
Простота: Интуитивный интерфейс (в отличие от перегруженных аналогов).
Внедрение «под ключ»: Перенос базы из Excel/других CRM за 14 дней, персональный аккаунт-менеджер.
Экосистема: Все функции (чат, аналитика, склад, приложение) включены в систему без необходимости сложных сторонних интеграций.

5. Целевая аудитория
Владельцы и управляющие фитнес-бизнеса (от локальных студий йоги до крупных сетей).
Отделы продаж и администраторы.
Тренерский состав.`;

      const promptText = `
        На основе следующих данных сгенерируй 3 варианта (A, B, C) для заголовка на странице (head_land) и текста на странице (text_land).
        
        Твоя задача:
        1. Найти в исходных данных (посыл, заголовок, текст) проблему клиента или его JTBD (Job To Be Done).
        2. В результате (в заголовке и тексте на странице) выдать ответ на эту проблему или JTBD, опираясь на информацию о продукте.
        
        СТРОГИЕ ОГРАНИЧЕНИЯ:
        - Длина сгенерированного заголовка (head_land) СТРОГО не более 80 символов.
        - Длина текста на странице (text_land) СТРОГО не более 140 символов.

        Учитывай следующую информацию о продукте при генерации:
        ${fitbaseInfo}

        Посыл: ${premise}
        Заголовок: ${title}
        Текст: ${text}
        ${fileContent ? `Дополнительный текст из файла: ${fileContent}` : ''}
        
        Верни результат строго в формате JSON:
        {
          "A": { "head_land": "...", "text_land": "..." },
          "B": { "head_land": "...", "text_land": "..." },
          "C": { "head_land": "...", "text_land": "..." }
        }
      `;

      const messages: any[] = [
        {
          role: 'user',
          content: [
            { type: 'text', text: promptText }
          ]
        }
      ];

      if (imageBase64) {
        messages[0].content.push({
          type: 'image_url',
          image_url: {
            url: imageBase64
          }
        });
      }

      const completion = await openai.chat.completions.create({
        messages: messages,
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      res.json(result);
    } catch (error) {
      console.error('Error generating variants:', error);
      res.status(500).json({ error: 'Failed to generate variants' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
