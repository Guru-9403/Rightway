/**
 * Database Verification Script
 * 
 * Tests connectivity to the configured Supabase PostgreSQL database
 * and inspects schema tables, columns, indexes, and row counts.
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const prisma = require("../prismaClient");

async function verifyDatabase() {
  console.log("==================================================");
  console.log("Supabase PostgreSQL Connectivity & Table Verification");
  console.log("==================================================");

  if (!process.env.DATABASE_URL) {
    console.error("❌ FAILED: DATABASE_URL is not defined in backend/.env");
    console.log("Please configure your Supabase connection strings in backend/.env:");
    console.log('DATABASE_URL="postgresql://postgres.[REF]:[PASS]@[HOST]:6543/postgres?pgbouncer=true"');
    console.log('DIRECT_URL="postgresql://postgres.[REF]:[PASS]@[HOST]:5432/postgres"');
    process.exit(1);
  }

  // Obfuscate connection string for log safety
  const safeUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ":****@");
  console.log(`Connecting to: ${safeUrl}`);

  try {
    // 1. Connectivity test
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1 as connected;`;
    const latency = Date.now() - startTime;
    console.log(`\n✔ Connectivity: SUCCESS (${latency}ms latency)`);

    // 2. PostgreSQL Server Version
    const versionResult = await prisma.$queryRaw`SELECT version();`;
    console.log(`✔ PostgreSQL Version: ${versionResult[0]?.version?.split(" ")[0] || "Unknown"}`);

    // 3. Inspect Tables in public schema
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('users', 'audit_logs', 'enquiries')
      ORDER BY table_name;
    `;

    const foundTables = tables.map((t) => t.table_name);
    console.log("\nFound Target Tables in public schema:", foundTables);

    const expectedTables = ["users", "audit_logs", "enquiries"];
    const verificationResults = [];

    for (const table of expectedTables) {
      const exists = foundTables.includes(table);
      let count = 0;
      if (exists) {
        if (table === "users") count = await prisma.user.count();
        if (table === "audit_logs") count = await prisma.auditLog.count();
        if (table === "enquiries") count = await prisma.enquiry.count();
      }

      verificationResults.push({
        Table: table,
        Created: exists ? "YES" : "NO",
        RowCount: exists ? count : "N/A",
        Status: exists ? "VERIFIED" : "PENDING MIGRATION",
      });
    }

    console.table(verificationResults);

    // 4. Index verification
    console.log("\nChecking Indexes...");
    const indexes = await prisma.$queryRaw`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND tablename IN ('users', 'audit_logs', 'enquiries')
      ORDER BY tablename, indexname;
    `;
    console.log(`✔ Found ${indexes.length} active index(es) across target tables.`);

    // 5. Foreign Key verification
    console.log("\nChecking Foreign Keys...");
    const foreignKeys = await prisma.$queryRaw`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
    `;
    console.log(`✔ Found ${foreignKeys.length} foreign key constraint(s):`);
    for (const fk of foreignKeys) {
      console.log(`   - ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    }

    console.log("\n==================================================");
    console.log("Database Verification Finished");
    console.log("==================================================");
  } catch (err) {
    console.error("\n❌ Database verification error:", err.message);
    if (err.message.includes("does not exist in the current database")) {
      console.log("Tables have not been applied to this Supabase database yet.");
      console.log("Run: npx prisma migrate deploy --schema=backend/prisma/schema.prisma");
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  verifyDatabase();
}

module.exports = { verifyDatabase };
