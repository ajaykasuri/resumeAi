require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function migrate() {
  console.log('🚀 Starting database migration...\n');

  // Connect without specifying database first to create it
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    const schemaPath = path.join(__dirname, '../../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📦 Creating database and tables...');
    await connection.query(schema);

    console.log('\n✅ Migration complete! Tables created:');
    console.log('   - users');
    console.log('   - guest_sessions');
    console.log('   - templates (with 8 default templates)');
    console.log('   - resumes');
    console.log('   - resume_sections');
    console.log('   - ai_resume_cache');
    console.log('   - ai_generation_history');
    console.log('   - downloads');
    console.log('   - resume_analytics');
    console.log('   - password_reset_tokens');
    console.log('\n🎉 Database ready! Run: npm run dev\n');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrate();
