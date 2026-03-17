exports.seed = async function(knex) {
  // Очищаем таблицы
  await knex('check_results').del()
  await knex('sites').del()
  await knex('users').del()

  // Создаем тестового пользователя
  const [userId] = await knex('users').insert({
    email: 'admin@example.com',
    password: '$2a$10$yourhashedpasswordhere', // замени на реальный хеш пароля
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }).returning('id')

  // Создаем тестовые сайты
  const sites = await knex('sites').insert([
    {
      name: 'Google',
      url: 'https://www.google.com',
      checkInterval: 5,
      isActive: true,
      userId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      name: 'GitHub',
      url: 'https://www.github.com',
      checkInterval: 5,
      isActive: true,
      userId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      name: 'Stack Overflow',
      url: 'https://stackoverflow.com',
      checkInterval: 5,
      isActive: true,
      userId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]).returning('id')

  // Создаем тестовые результаты проверок
  const results = []
  for (const site of sites) {
    for (let i = 0; i < 10; i++) {
      const date = new Date()
      date.setHours(date.getHours() - i)
      
      results.push({
        siteId: site.id,
        status: Math.random() > 0.1 ? 'up' : 'down',
        responseTime: Math.floor(Math.random() * 200) + 50,
        statusCode: 200,
        checkedAt: date.toISOString(),
      })
    }
  }
  
  await knex('check_results').insert(results)
}