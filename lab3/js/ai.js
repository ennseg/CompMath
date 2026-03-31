async function sendToAI() {
  const input = document.getElementById('chat-input');
  const responseDiv = document.getElementById('chat-response');

  if (!input.value.trim()) return;

  const integralLabel = getIntegralLabel();
  const a   = document.getElementById('integrals_min').value;
  const b   = document.getElementById('integrals_max').value;
  const eps = document.getElementById('integrals_accuracy').value;

  const message =
    `Интеграл: ${integralLabel}\n` +
    `Метод вычисления: ${input.value.trim()}\n` +
    `Нижняя граница интегрирования: ${a}\n` +
    `Верхняя граница интегрирования: ${b}\n` +
    `Точность интегрирования: ${eps}\n` +
    `В своём ответе напиши ТОЛЬКО значение интеграла и число разбиений интервала для достижения требуемой точности.`;

  responseDiv.innerText = 'Загрузка...';

  try {
    const response = await fetch('http://94.177.145.198:5000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: message }],
        model: 'GigaChat',
        max_tokens: 1000
      })
    });

    if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error('Неожиданный формат ответа: ' + JSON.stringify(data));
    }

    responseDiv.innerText = data.choices[0].message.content;
  } catch (err) {
    responseDiv.innerText = `Ошибка: ${err.message}`;
  }
}
