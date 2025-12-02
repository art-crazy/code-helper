# ⚡ Быстрый старт

## 🚀 Установка за 5 минут

### 1. Клонируйте репозиторий
```bash
git clone https://github.com/art-crazy/code-helper.git
cd code-helper
```

### 2. Установите зависимости
```bash
npm install
```

### 3. Соберите расширение
```bash
npm run build
```

### 4. Загрузите в Chrome
1. Откройте `chrome://extensions/`
2. Включите **"Режим разработчика"**
3. Нажмите **"Загрузить распакованное расширение"**
4. Выберите папку `dist`

### 5. Настройте API ключ
1. Получите ключ на [Google AI Studio](https://ai.google.dev/gemini-api/docs/api-key)
2. Кликните на иконку расширения
3. Введите API ключ
4. Готово! 🎉

## 💡 Первое использование

1. Откройте любую страницу с кодом (например, [LeetCode](https://leetcode.com/problems/two-sum/))
2. Кликните на иконку расширения
3. Расширение автоматически найдет код на странице
4. Выберите действие:
   - 💡 **Объяснить** - получите подробное объяснение
   - ⚡ **Оптимизировать** - узнайте, как улучшить код
   - 🐛 **Дебаг** - найдите возможные ошибки

## 🎯 Примеры сайтов для тестирования

- [LeetCode](https://leetcode.com/) - задачи по программированию
- [HackerRank](https://www.hackerrank.com/) - coding challenges
- [GitHub](https://github.com/) - просмотр кода
- [StackOverflow](https://stackoverflow.com/) - вопросы и ответы
- [CodePen](https://codepen.io/) - веб-разработка

## 🔧 Команды разработки

```bash
# Разработка с hot reload
npm run dev

# Сборка production
npm run build

# Watch mode
npm run watch
```

## ❓ Частые вопросы

**Q: Где найти API ключ?**
A: Перейдите на https://ai.google.dev/gemini-api/docs/api-key

**Q: Расширение не находит код?**
A: Обновите страницу после установки расширения

**Q: Безопасен ли мой API ключ?**
A: Да! Ключ хранится локально в Chrome и используется только для прямых запросов к Gemini API

**Q: Есть ли ограничения по использованию?**
A: Да, согласно квотам Gemini API (обычно 60 запросов/минуту для бесплатного tier)

## 📚 Дополнительная документация

- [README.md](README.md) - Полная документация
- [INSTALLATION.md](INSTALLATION.md) - Детальная инструкция по установке
- [CONTRIBUTING.md](CONTRIBUTING.md) - Как внести вклад в проект

## 🆘 Нужна помощь?

- [Issues на GitHub](https://github.com/art-crazy/code-helper/issues)
- Проверьте консоль Chrome на наличие ошибок
- Убедитесь, что API ключ активен

---

**Готовы? Начните кодить с AI помощником! 🚀**
