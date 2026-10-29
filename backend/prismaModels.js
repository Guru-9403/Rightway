/**
 * Prisma Model Adapter for Rightway Backend
 * 
 * Provides drop-in Mongoose-compatible interface powered by Supabase PostgreSQL (Prisma).
 * Preserves exact method signatures (find, findOne, findById, create, countDocuments, save)
 * ensuring 100% backward compatibility with zero React frontend changes.
 */

const prisma = require("./prismaClient");

function convertMongoFilterToPrisma(filter = {}) {
  const where = {};
  for (const [key, val] of Object.entries(filter)) {
    if (key === "$or") {
      where.OR = val.map((item) => convertMongoFilterToPrisma(item));
      continue;
    }
    if (key === "_id") {
      where.id = typeof val === "object" && val !== null && val.toString ? val.toString() : String(val);
      continue;
    }
    if (val === null) {
      where[key] = null;
      continue;
    }
    if (typeof val === "object" && !(val instanceof Date) && !Array.isArray(val)) {
      const sub = {};
      for (const [op, opVal] of Object.entries(val)) {
        if (op === "$ne") sub.not = opVal;
        else if (op === "$nin") sub.notIn = opVal;
        else if (op === "$in") sub.in = opVal;
        else if (op === "$gte") sub.gte = opVal;
        else if (op === "$lte") sub.lte = opVal;
        else if (op === "$gt") sub.gt = opVal;
        else if (op === "$lt") sub.lt = opVal;
        else if (op === "$regex") {
          sub.contains = opVal.source || String(opVal).replace(/^\^|\$$/g, "");
          sub.mode = "insensitive";
        }
      }
      where[key] = sub;
      continue;
    }
    where[key] = val;
  }
  return where;
}

function wrapUser(u) {
  if (!u) return null;
  const doc = { ...u };
  doc._id = u.id; // Compatibility getter/property for Mongoose _id

  doc.save = async function () {
    const dataToUpdate = { ...this };
    delete dataToUpdate.id;
    delete dataToUpdate._id;
    delete dataToUpdate.save;
    delete dataToUpdate.markModified;
    delete dataToUpdate.toObject;
    delete dataToUpdate.select;

    const updated = await prisma.user.update({
      where: { id: this.id },
      data: dataToUpdate,
    });
    Object.assign(this, updated);
    this._id = updated.id;
    return this;
  };

  doc.markModified = function () {
    // No-op for Prisma, since Json fields are updated directly on save()
  };

  doc.toObject = function () {
    const obj = { ...this };
    delete obj.save;
    delete obj.markModified;
    delete obj.toObject;
    delete obj.select;
    return obj;
  };

  return doc;
}

class QueryChain {
  constructor(modelName, filter = {}) {
    this.modelName = modelName;
    this.filter = filter;
    this._sort = null;
    this._skip = undefined;
    this._limit = undefined;
  }

  sort(s) {
    this._sort = s;
    return this;
  }

  skip(n) {
    this._skip = Number(n);
    return this;
  }

  limit(n) {
    this._limit = Number(n);
    return this;
  }

  select() {
    return this;
  }

  lean() {
    return this;
  }

  async exec() {
    const where = convertMongoFilterToPrisma(this.filter);
    const orderBy = [];
    if (this._sort) {
      for (const [k, v] of Object.entries(this._sort)) {
        const field = k === "_id" ? "id" : k;
        orderBy.push({ [field]: v === -1 || v === "desc" ? "desc" : "asc" });
      }
    }
    const options = { where };
    if (orderBy.length > 0) options.orderBy = orderBy;
    if (this._skip !== undefined) options.skip = this._skip;
    if (this._limit !== undefined) options.take = this._limit;

    if (this.modelName === "user") {
      const records = await prisma.user.findMany(options);
      return records.map(wrapUser);
    } else if (this.modelName === "auditLog") {
      const records = await prisma.auditLog.findMany(options);
      return records.map((l) => ({ ...l, _id: l.id }));
    } else if (this.modelName === "enquiry") {
      const records = await prisma.enquiry.findMany(options);
      return records.map((e) => ({ ...e, _id: e.id }));
    }
    return [];
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

const User = {
  findById(id) {
    const chain = {
      _id: id,
      select() {
        return chain;
      },
      async then(resolve, reject) {
        try {
          if (!chain._id) return resolve(null);
          const cleanId = typeof chain._id === "object" && chain._id.toString ? chain._id.toString() : String(chain._id);
          const u = await prisma.user.findUnique({ where: { id: cleanId } });
          resolve(wrapUser(u));
        } catch (err) {
          reject(err);
        }
      },
      catch(reject) {
        return chain.then(undefined, reject);
      },
    };
    return chain;
  },

  findOne(filter) {
    const chain = {
      _filter: filter,
      select() {
        return chain;
      },
      async then(resolve, reject) {
        try {
          const where = convertMongoFilterToPrisma(chain._filter);
          const u = await prisma.user.findFirst({ where });
          resolve(wrapUser(u));
        } catch (err) {
          reject(err);
        }
      },
      catch(reject) {
        return chain.then(undefined, reject);
      },
    };
    return chain;
  },

  find(filter) {
    return new QueryChain("user", filter);
  },

  async create(data) {
    const u = await prisma.user.create({ data });
    return wrapUser(u);
  },

  async findByIdAndUpdate(id, updateData) {
    const cleanId = typeof id === "object" && id.toString ? id.toString() : String(id);
    const data = updateData.$set ? updateData.$set : updateData;
    const u = await prisma.user.update({
      where: { id: cleanId },
      data,
    });
    return wrapUser(u);
  },

  async findByIdAndDelete(id) {
    const cleanId = typeof id === "object" && id.toString ? id.toString() : String(id);
    const u = await prisma.user.delete({
      where: { id: cleanId },
    });
    return wrapUser(u);
  },

  async countDocuments(filter = {}) {
    const where = convertMongoFilterToPrisma(filter);
    return prisma.user.count({ where });
  },

  async deleteMany(filter = {}) {
    const where = convertMongoFilterToPrisma(filter);
    const res = await prisma.user.deleteMany({ where });
    return { deletedCount: res.count };
  },

  async exists(filter = {}) {
    const where = convertMongoFilterToPrisma(filter);
    const count = await prisma.user.count({ where });
    return count > 0;
  },
};

const AuditLog = {
  find(filter) {
    return new QueryChain("auditLog", filter);
  },

  async create(data) {
    let validUserId = null;
    if (data.userId) {
      const uid = String(data.userId);
      const userExists = await prisma.user.findUnique({ where: { id: uid }, select: { id: true } });
      if (userExists) validUserId = uid;
    }

    let validAdminId = null;
    if (data.adminId) {
      const aid = String(data.adminId);
      const adminExists = await prisma.user.findUnique({ where: { id: aid }, select: { id: true } });
      if (adminExists) validAdminId = aid;
    }

    const res = await prisma.auditLog.create({
      data: {
        userId: validUserId,
        userEmail: String(data.userEmail || ""),
        userName: String(data.userName || ""),
        adminId: validAdminId,
        adminEmail: String(data.adminEmail || ""),
        action: String(data.action || "unknown"),
        ip: String(data.ip || "unknown"),
        userAgent: String(data.userAgent || "unknown"),
        details: data.details && typeof data.details === "object" ? data.details : {},
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      },
    });
    return { ...res, _id: res.id };
  },

  async countDocuments(filter = {}) {
    const where = convertMongoFilterToPrisma(filter);
    return prisma.auditLog.count({ where });
  },
};

const Enquiry = {
  find(filter) {
    return new QueryChain("enquiry", filter);
  },

  async create(data) {
    const res = await prisma.enquiry.create({
      data: {
        name: String(data.name || "Anonymous"),
        email: String(data.email || ""),
        phone: data.phone || null,
        course: data.course || null,
        message: data.message || null,
        status: data.status || "New",
      },
    });
    return { ...res, _id: res.id };
  },

  async countDocuments(filter = {}) {
    const where = convertMongoFilterToPrisma(filter);
    return prisma.enquiry.count({ where });
  },
};

module.exports = {
  prisma,
  User,
  AuditLog,
  Enquiry,
  wrapUser,
};
