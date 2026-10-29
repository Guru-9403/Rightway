/**
 * MongoDB to Supabase PostgreSQL Data Migration Script
 * 
 * Safely reads from MongoDB and idempotent-upserts into Supabase PostgreSQL using Prisma.
 * Does NOT delete, modify, or overwrite any existing MongoDB data.
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const prisma = require("../prismaClient");

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("ERROR: MONGO_URI is missing from backend/.env");
  process.exit(1);
}

const emptySlots = (count) =>
  Array.from({ length: count }, () => ({ taskCompleted: false, testPassed: false }));

async function runMigration() {
  console.log("==================================================");
  console.log("Starting MongoDB to Supabase PostgreSQL Migration");
  console.log("==================================================");

  try {
    // 1. Connect to MongoDB (read-only mode)
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB successfully.");

    const db = mongoose.connection.db;

    // 2. Migrate Users
    console.log("\n--- 1. Migrating Users ---");
    const mongoUsersCollection = db.collection("users");
    const mongoUsers = await mongoUsersCollection.find({}).toArray();
    console.log(`Found ${mongoUsers.length} user(s) in MongoDB.`);

    let migratedUsers = 0;
    const existingUserIds = new Set();

    for (const u of mongoUsers) {
      const id = u._id ? u._id.toString() : undefined;
      if (!id) continue;
      existingUserIds.add(id);

      const userData = {
        name: u.name || "Student",
        email: (u.email || "").toLowerCase().trim(),
        password: u.password || null,
        role: u.role || "student",
        studentId: u.studentId || null,
        enrolledCourse: u.enrolledCourse || "Full Stack Web Development",
        xp: typeof u.xp === "number" ? u.xp : 0,
        statuses: Array.isArray(u.statuses) && u.statuses.length ? u.statuses : emptySlots(10),
        cssStatuses: Array.isArray(u.cssStatuses) && u.cssStatuses.length ? u.cssStatuses : emptySlots(12),
        jsStatuses: Array.isArray(u.jsStatuses) && u.jsStatuses.length ? u.jsStatuses : emptySlots(6),
        medicalStatuses: Array.isArray(u.medicalStatuses) && u.medicalStatuses.length ? u.medicalStatuses : emptySlots(15),
        graphicDesignStatuses: Array.isArray(u.graphicDesignStatuses) && u.graphicDesignStatuses.length ? u.graphicDesignStatuses : emptySlots(12),
        certificateId: u.certificateId || null,
        certificateIssuedAt: u.certificateIssuedAt ? new Date(u.certificateIssuedAt) : null,
        termsAcceptedAt: u.termsAcceptedAt ? new Date(u.termsAcceptedAt) : null,
        emailVerified: Boolean(u.emailVerified || u.isEmailVerified),
        isEmailVerified: Boolean(u.isEmailVerified || u.emailVerified),
        otpHash: u.otpHash || null,
        otpExpiresAt: u.otpExpiresAt ? new Date(u.otpExpiresAt) : null,
        otpAttempts: typeof u.otpAttempts === "number" ? u.otpAttempts : 0,
        otpResendAvailableAt: u.otpResendAvailableAt ? new Date(u.otpResendAvailableAt) : null,
        emailVerificationTokenHash: u.emailVerificationTokenHash || null,
        emailVerificationExpiresAt: u.emailVerificationExpiresAt ? new Date(u.emailVerificationExpiresAt) : null,
        passwordResetTokenHash: u.passwordResetTokenHash || null,
        passwordResetExpiresAt: u.passwordResetExpiresAt ? new Date(u.passwordResetExpiresAt) : null,
        passwordResetOtpAttempts: typeof u.passwordResetOtpAttempts === "number" ? u.passwordResetOtpAttempts : 0,
        passwordResetResendAvailableAt: u.passwordResetResendAvailableAt ? new Date(u.passwordResetResendAvailableAt) : null,
        refreshTokenHash: u.refreshTokenHash || null,
        loginAttempts: typeof u.loginAttempts === "number" ? u.loginAttempts : 0,
        lockUntil: u.lockUntil ? new Date(u.lockUntil) : null,
        loginCount: typeof u.loginCount === "number" ? u.loginCount : 1,
        isBlocked: Boolean(u.isBlocked),
        deletedAt: u.deletedAt ? new Date(u.deletedAt) : null,
        authProvider: u.authProvider || (u.password ? "email" : "google"),
        lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt) : (u.createdAt ? new Date(u.createdAt) : new Date()),
        lastActiveAt: u.lastActiveAt ? new Date(u.lastActiveAt) : new Date(),
        createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
        updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date(),
      };

      await prisma.user.upsert({
        where: { id },
        update: userData,
        create: { id, ...userData },
      });
      migratedUsers++;
    }
    console.log(`Successfully upserted ${migratedUsers} user(s) into PostgreSQL.`);

    // 3. Migrate Audit Logs
    console.log("\n--- 2. Migrating Audit Logs ---");
    const mongoAuditLogsCollection = db.collection("auditlogs");
    const mongoAuditLogs = await mongoAuditLogsCollection.find({}).toArray();
    console.log(`Found ${mongoAuditLogs.length} audit log(s) in MongoDB.`);

    let migratedLogs = 0;
    for (const log of mongoAuditLogs) {
      const id = log._id ? log._id.toString() : undefined;
      if (!id) continue;

      const rawUserId = log.userId ? log.userId.toString() : null;
      const rawAdminId = log.adminId ? log.adminId.toString() : null;

      const auditData = {
        userId: rawUserId && existingUserIds.has(rawUserId) ? rawUserId : null,
        userEmail: log.userEmail || "",
        userName: log.userName || "",
        adminId: rawAdminId && existingUserIds.has(rawAdminId) ? rawAdminId : null,
        adminEmail: log.adminEmail || "",
        action: log.action || "unknown",
        ip: log.ip || "",
        userAgent: log.userAgent || "",
        details: log.details && typeof log.details === "object" ? log.details : {},
        timestamp: log.timestamp ? new Date(log.timestamp) : (log.createdAt ? new Date(log.createdAt) : new Date()),
      };

      await prisma.auditLog.upsert({
        where: { id },
        update: auditData,
        create: { id, ...auditData },
      });
      migratedLogs++;
    }
    console.log(`Successfully upserted ${migratedLogs} audit log(s) into PostgreSQL.`);

    // 4. Migrate Enquiries
    console.log("\n--- 3. Migrating Enquiries ---");
    const mongoEnquiriesCollection = db.collection("enquiries");
    const mongoEnquiries = await mongoEnquiriesCollection.find({}).toArray();
    console.log(`Found ${mongoEnquiries.length} enquiry/enquiries in MongoDB.`);

    let migratedEnquiries = 0;
    for (const enq of mongoEnquiries) {
      const id = enq._id ? enq._id.toString() : undefined;
      if (!id) continue;

      const enqData = {
        name: enq.name || "Anonymous",
        email: enq.email || "",
        phone: enq.phone || null,
        course: enq.course || null,
        message: enq.message || null,
        status: enq.status || "New",
        createdAt: enq.createdAt ? new Date(enq.createdAt) : new Date(),
        updatedAt: enq.updatedAt ? new Date(enq.updatedAt) : new Date(),
      };

      await prisma.enquiry.upsert({
        where: { id },
        update: enqData,
        create: { id, ...enqData },
      });
      migratedEnquiries++;
    }
    console.log(`Successfully upserted ${migratedEnquiries} enquiry/enquiries into PostgreSQL.`);

    // 5. Verification & Summary Report
    console.log("\n==================================================");
    console.log("Migration Verification Summary");
    console.log("==================================================");
    const pgUserCount = await prisma.user.count();
    const pgAuditCount = await prisma.auditLog.count();
    const pgEnquiryCount = await prisma.enquiry.count();

    console.table([
      { Entity: "Users", MongoDB: mongoUsers.length, PostgreSQL: pgUserCount, Status: pgUserCount >= mongoUsers.length ? "VERIFIED" : "MISMATCH" },
      { Entity: "Audit Logs", MongoDB: mongoAuditLogs.length, PostgreSQL: pgAuditCount, Status: pgAuditCount >= mongoAuditLogs.length ? "VERIFIED" : "MISMATCH" },
      { Entity: "Enquiries", MongoDB: mongoEnquiries.length, PostgreSQL: pgEnquiryCount, Status: pgEnquiryCount >= mongoEnquiries.length ? "VERIFIED" : "MISMATCH" },
    ]);

    console.log("\nMigration completed successfully. MongoDB records remain untouched.");
  } catch (err) {
    console.error("Migration failed with error:", err);
  } finally {
    await mongoose.disconnect();
    await prisma.$disconnect();
    console.log("Closed all database connections.");
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
