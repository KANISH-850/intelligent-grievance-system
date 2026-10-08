# Database Documentation — Intelligent Grievance System

## 1. Database Purpose
The PostgreSQL database for the **Intelligent Grievance System** serves as the relational data store for citizens, officers, administrators, departments, submitted grievances, and status audit logs.

---

## 2. Environment Variables & Setup

Add `DATABASE_URL` to your local `backend/.env` file:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/intelligent_grievance"
```

> **Note:** Do NOT commit actual credentials to Git repository. `.env` is ignored by default.

---

## 3. Database Schema

The database consists of 4 main relational entities managed via **Prisma ORM**:

### Enums
* **Role**: `CITIZEN`, `OFFICER`, `ADMIN`
* **Priority**: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
* **Status**: `SUBMITTED`, `ASSIGNED`, `UNDER_REVIEW`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`

### Tables
1. **users**
   * `id` (UUID, Primary Key)
   * `name` (VarChar)
   * `email` (VarChar, Unique)
   * `password_hash` (VarChar, bcrypt hashed)
   * `role` (Enum `Role`, default `CITIZEN`)
   * `created_at`, `updated_at` (Timestamp)

2. **departments**
   * `id` (UUID, Primary Key)
   * `name` (VarChar)
   * `code` (VarChar, Unique)
   * `description` (Text)
   * `created_at`, `updated_at` (Timestamp)

3. **grievances**
   * `id` (UUID, Primary Key)
   * `grievance_number` (VarChar, Unique)
   * `user_id` (FK → `users.id`)
   * `original_text` (Text)
   * `detected_language` (VarChar, Optional)
   * `translated_text` (Text, Optional)
   * `category` (VarChar)
   * `priority` (Enum `Priority`)
   * `department_id` (FK → `departments.id`)
   * `status` (Enum `Status`, default `SUBMITTED`)
   * `created_at`, `updated_at` (Timestamp)

4. **grievance_status_history**
   * `id` (UUID, Primary Key)
   * `grievance_id` (FK → `grievances.id`)
   * `status` (Enum `Status`)
   * `remarks` (Text, Optional)
   * `changed_by` (FK → `users.id`)
   * `created_at` (Timestamp)

---

## 4. Entity Relationships
```
[users] 1 ────< N [grievances]
[departments] 1 ────< N [grievances]
[grievances] 1 ────< N [grievance_status_history]
[users] 1 ────< N [grievance_status_history] (changed_by)
```

---

## 5. Migration & Seed Commands

Navigate to `backend/` directory:

```bash
# Generate Prisma Client
npm run db:generate

# Apply Migrations
npm run db:migrate

# Seed Initial Data (Departments & Demo Users)
npm run db:seed
```

---

## 6. Seeded Demo Data (Development Only)

### Default Departments (9):
* `WS`: Water Supply
* `ELEC`: Electricity
* `RT`: Roads and Transport
* `HC`: Healthcare
* `EDU`: Education
* `SAN`: Sanitation
* `MS`: Municipal Services
* `REV`: Revenue
* `OTH`: Other

### Demo Users:
* **Citizen**: `citizen@example.com` / `Password@123`
* **Officer**: `officer@example.com` / `Password@123`
* **Admin**: `admin@example.com` / `Password@123`
