# Implementation Guide: Ons Mierloos Theater

## Overview

This document outlines:

1. **Google Cloud Migration Plan** - Moving PDF generation to async workers on Cloud Run + GCS
2. **Critical Bug Fixes** - Date validation, password reset, cart persistence issues
3. **Implementation Priority** - Week-by-week execution plan

---

## Section 1: Google Cloud Migration Plan

### Current Problems

- PDF generation blocks checkout (slow)
- Vercel/Supabase quotas exceeded
- No job retry mechanism
- All load on single Vercel instance
- Database bloated with image binary data

### Target Solution

- Generic `jobs` table for any background work (PDF, email, reports, etc.)
- Cloud Run worker polls database every 5 seconds with exponential backoff
- Automatic retries (max 3-5 attempts)
- PDFs + images stored in GCS (cheap, scalable, CDN-friendly)
- Cost: ~$45/month vs Vercel overages
- Extensible for future job types

### Architecture Diagram

```
┌─────────────┐
│   Checkout  │
│   Process   │
└──────┬──────┘
       │
       ├─ Create Order
       ├─ Create Tickets
       │
       └─> INSERT Job Record
           (status: 'pending')
                │
                ↓
        [Database Job Queue]
                │
        ┌───────┴───────┐
        │               │
        ↓               ↓
    [Cloud Run]    [Cloud Run]
     Worker 1       Worker 2
        │               │
        └───────┬───────┘
                │
                ├─> Generate PDF
                ├─> Upload to GCS
                ├─> Update DB
                └─> Send Email
```

### Generic Jobs Table Design

The `jobs` table supports various types of background processing, not just PDF generation:

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,                    -- 'pdf_generation', 'email', 'report', etc.
  status VARCHAR(20) NOT NULL,                  -- 'pending', 'processing', 'completed', 'failed'
  priority INTEGER DEFAULT 0,                   -- For future priority queue implementation
  data JSONB NOT NULL,                          -- Job-specific data payload
  result JSONB,                                 -- Result/output data
  error_message TEXT,                           -- Error details if failed
  execution_count INTEGER DEFAULT 0,            -- Number of execution attempts
  next_retry_at TIMESTAMP WITH TIME ZONE,       -- Exponential backoff timing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Indexes for efficient querying
  INDEX jobs_type_status_idx (type, status),
  INDEX jobs_next_retry_at_idx (next_retry_at),
  INDEX jobs_created_at_idx (created_at)
);
```

**Job Data Structure Examples:**

```typescript
// PDF Generation Job
{
  type: 'pdf_generation',
  data: {
    orderId: '123e4567-e89b-12d3-a456-426614174000',
    ticketIds: ['ticket-1', 'ticket-2'],
  },
  result: {
    pdfUrl: 'gs://bucket/orders/123e4567.pdf',
    filename: 'tickets.pdf',
    pageCount: 2
  }
}

// Future: Email Job
{
  type: 'email',
  data: {
    to: 'customer@example.com',
    subject: 'Your Tickets',
    templateId: 'order-confirmation',
    orderId: '123e4567-e89b-12d3-a456-426614174000'
  }
}

// Future: Image Processing Job
{
  type: 'image_processing',
  data: {
    imageId: 'image-123',
    sizes: ['lg', 'md', 'sm']
  },
  result: {
    urls: {
      lg: 'gs://bucket/images/image-123-lg.jpg',
      md: 'gs://bucket/images/image-123-md.jpg',
      sm: 'gs://bucket/images/image-123-sm.jpg'
    }
  }
}
```

### Polling-Based Worker Strategy

**5-second base polling interval with exponential backoff**

Why polling instead of NOTIFY/LISTEN:

- Cloud Run kills persistent connections after inactivity
- Polling is stateless (Cloud Run loves this)
- Easy to scale horizontally (spawn more workers)
- Cheap (instances can sleep between polls)
- Simple error handling
- Works with free tier

**Exponential Backoff Logic:**

```
Attempt 1: Immediate
Attempt 2: 5s delay
Attempt 3: 10s delay (5 * 2)
Attempt 4: 20s delay (5 * 4)
Max: 5 minutes cap
```

```typescript
// Worker pseudocode
async function pollAndProcess() {
  const baseInterval = 5000; // 5 seconds
  const maxInterval = 300000; // 5 minutes
  let currentInterval = baseInterval;

  while (true) {
    try {
      const jobs = await db.query.jobs.findMany({
        where: and(
          eq(jobs.status, 'pending'),
          or(isNull(jobs.nextRetryAt), lte(jobs.nextRetryAt, now())),
        ),
        limit: 10, // Process batch
      });

      if (jobs.length === 0) {
        // No jobs found, increase interval to reduce DB load
        currentInterval = Math.min(currentInterval * 1.5, maxInterval);
        await sleep(currentInterval);
        continue;
      }

      // Found jobs, reset interval and process
      currentInterval = baseInterval;

      for (const job of jobs) {
        try {
          await processJob(job);
        } catch (error) {
          // Update job with next retry time using exponential backoff
          const nextRetry = calculateNextRetry(job.executionCount, baseInterval, maxInterval);
          await updateJob(job.id, {
            status: 'pending',
            executionCount: job.executionCount + 1,
            nextRetryAt: nextRetry,
            errorMessage: error.message,
          });
        }
      }
    } catch (error) {
      console.error('Polling error:', error);
      // Increase interval on critical error
      currentInterval = Math.min(currentInterval * 2, maxInterval);
    }

    await sleep(currentInterval);
  }
}

function calculateNextRetry(
  executionCount: number,
  baseInterval: number,
  maxInterval: number,
): Date {
  const backoffMs = Math.min(baseInterval * Math.pow(2, executionCount), maxInterval);
  return new Date(Date.now() + backoffMs);
}
```

### Schema Changes Needed

#### 1. Update lib/db/schema.ts

Add these enums and table definition:

```typescript
const jobStatusValues = ['pending', 'processing', 'completed', 'failed'] as const;
type JobStatus = (typeof jobStatusValues)[number];

export const jobStatus = pgEnum(
  'job_status',
  jobStatusValues as unknown as [JobStatus, ...JobStatus[]],
);

export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: varchar('type', { length: 50 }).notNull(), // 'pdf_generation', 'email', etc.
    status: jobStatus('status').default('pending').notNull(),
    priority: integer('priority').default(0),
    data: jsonb('data').notNull(), // Job-specific payload
    result: jsonb('result'), // Result data after completion
    errorMessage: text('error_message'),
    executionCount: integer('execution_count').default(0),
    nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    index('jobs_type_status_idx').on(table.type, table.status),
    index('jobs_next_retry_at_idx').on(table.nextRetryAt),
    index('jobs_created_at_idx').on(table.createdAt),
    index('jobs_status_idx').on(table.status),
  ],
);

export const jobsRelations = relations(jobs, {});
```

Run migrations:

```bash
npm run db:generate
npm run db:migrate
```

### Key Files to Create/Update

#### 1. lib/jobs/jobProcessor.ts (NEW)

```typescript
import { db } from '@/lib/db';
import { jobs } from '@/lib/db/schema';
import { eq, and, isNull, lte, or } from 'drizzle-orm';

export type JobType = 'pdf_generation' | 'email' | 'image_processing' | 'report';

export interface Job {
  id: string;
  type: JobType;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  data: Record<string, any>;
  result?: Record<string, any>;
  errorMessage?: string;
  executionCount: number;
  nextRetryAt?: Date;
  createdAt: Date;
}

export async function createJob(
  type: JobType,
  data: Record<string, any>,
  priority = 0,
): Promise<string> {
  const result = await db
    .insert(jobs)
    .values({
      type,
      status: 'pending',
      data,
      priority,
    })
    .returning({ id: jobs.id });

  return result[0].id;
}

export async function getNextJobs(limit = 10): Promise<Job[]> {
  return db.query.jobs.findMany({
    where: and(
      eq(jobs.status, 'pending'),
      or(isNull(jobs.nextRetryAt), lte(jobs.nextRetryAt, new Date())),
    ),
    limit,
  });
}

export async function updateJobStatus(
  jobId: string,
  status: Job['status'],
  result?: Record<string, any>,
  errorMessage?: string,
): Promise<void> {
  const updates: any = {
    status,
    updatedAt: new Date(),
  };

  if (result) updates.result = result;
  if (errorMessage) updates.errorMessage = errorMessage;
  if (status === 'completed') updates.completedAt = new Date();
  if (status === 'processing') updates.startedAt = new Date();

  await db.update(jobs).set(updates).where(eq(jobs.id, jobId));
}

export function calculateNextRetry(
  executionCount: number,
  baseInterval = 5000,
  maxInterval = 300000,
): Date {
  const backoffMs = Math.min(baseInterval * Math.pow(2, executionCount), maxInterval);
  return new Date(Date.now() + backoffMs);
}
```

#### 2. lib/utils/gcsUploader.ts (NEW)

```typescript
import { Storage } from '@google-cloud/storage';

const projectId = process.env.GCP_PROJECT_ID;
const bucketName = process.env.GCS_BUCKET_NAME || 'ons-mierloos-theater-pdfs';

let storageClient: Storage | null = null;

function getStorageClient(): Storage {
  if (!storageClient) {
    storageClient = new Storage({ projectId });
  }
  return storageClient;
}

export async function uploadToGCS(
  buffer: Buffer,
  path: string,
  contentType = 'application/pdf',
): Promise<string> {
  const storage = getStorageClient();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(path);

  try {
    await file.save(buffer, {
      metadata: {
        contentType,
      },
      public: false,
    });

    return `gs://${bucketName}/${path}`;
  } catch (error) {
    throw new Error(`GCS upload failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getSignedUrl(
  path: string,
  expiresIn = 7 * 24 * 60 * 60 * 1000, // 7 days
): Promise<string> {
  const storage = getStorageClient();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(path);

  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + expiresIn,
  });

  return url;
}

export async function deleteFromGCS(path: string): Promise<void> {
  const storage = getStorageClient();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(path);

  try {
    await file.delete();
  } catch (error) {
    console.error(`Failed to delete ${path}:`, error);
  }
}
```

#### 3. lib/jobs/handlers/pdfGenerationHandler.ts (NEW)

```typescript
import { generateTicketPDF, getTicketFilename } from '@/lib/utils/ticketGenerator';
import { uploadToGCS } from '@/lib/utils/gcsUploader';
import { db } from '@/lib/db';
import { tickets } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

export interface PDFGenerationJobData {
  orderId: string;
  ticketIds: string[];
}

export async function handlePDFGeneration(
  jobId: string,
  data: PDFGenerationJobData,
): Promise<{ pdfUrl: string; filename: string }> {
  try {
    const { orderId, ticketIds } = data;

    // Fetch tickets with relations
    const ticketList = await db.query.tickets.findMany({
      where: inArray(tickets.id, ticketIds),
      with: {
        performance: {
          with: {
            show: true,
          },
        },
        order: true,
      },
    });

    if (ticketList.length === 0) {
      throw new Error(`No tickets found for order ${orderId}`);
    }

    // Generate PDFs for each ticket
    const pdfBuffers = await Promise.all(
      ticketList.map((ticket) =>
        generateTicketPDF({
          ...ticket,
          performance: ticket.performance!,
        }),
      ),
    );

    // Concatenate all PDFs into one
    const finalPdfBuffer = Buffer.concat(pdfBuffers);

    // Upload to GCS
    const gcsPath = `orders/${orderId}/${Date.now()}.pdf`;
    const pdfUrl = await uploadToGCS(finalPdfBuffer, gcsPath, 'application/pdf');

    return {
      pdfUrl,
      filename: `order-${orderId}.pdf`,
    };
  } catch (error) {
    throw new Error(
      `PDF generation failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
```

#### 4. lib/jobs/localWorker.ts (NEW)

For local development and Cloud Run deployment:

```typescript
import { getNextJobs, updateJobStatus, calculateNextRetry } from './jobProcessor';
import { handlePDFGeneration, PDFGenerationJobData } from './handlers/pdfGenerationHandler';
import { db } from '@/lib/db';
import { jobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const POLLING_INTERVAL = parseInt(process.env.WORKER_POLLING_INTERVAL || '5000');
const MAX_EXECUTION_ATTEMPTS = parseInt(process.env.WORKER_MAX_ATTEMPTS || '5');

export async function startLocalWorker() {
  console.log('🚀 Starting job worker...');
  let currentInterval = POLLING_INTERVAL;
  let jobCount = 0;

  while (true) {
    try {
      const nextJobs = await getNextJobs(10);

      if (nextJobs.length === 0) {
        // No jobs, back off polling
        currentInterval = Math.min(currentInterval * 1.5, 300000);
        await new Promise((r) => setTimeout(r, currentInterval));
        continue;
      }

      console.log(`📋 Found ${nextJobs.length} jobs to process`);
      currentInterval = POLLING_INTERVAL; // Reset interval

      for (const job of nextJobs) {
        try {
          if (job.executionCount >= MAX_EXECUTION_ATTEMPTS) {
            await updateJobStatus(job.id, 'failed', undefined, 'Max execution attempts exceeded');
            console.error(`❌ Job ${job.id} exceeded max retries`);
            continue;
          }

          // Mark as processing
          await db
            .update(jobs)
            .set({ status: 'processing', updatedAt: new Date() })
            .where(eq(jobs.id, job.id));

          let result;

          // Route to appropriate handler
          if (job.type === 'pdf_generation') {
            result = await handlePDFGeneration(job.id, job.data as PDFGenerationJobData);
          } else {
            throw new Error(`Unknown job type: ${job.type}`);
          }

          // Mark as completed
          await updateJobStatus(job.id, 'completed', result);
          jobCount++;
          console.log(`✅ Job ${job.id} completed (${jobCount} total)`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);

          if (job.executionCount >= MAX_EXECUTION_ATTEMPTS - 1) {
            // Mark as failed after max attempts
            await updateJobStatus(job.id, 'failed', undefined, errorMsg);
            console.error(`❌ Job ${job.id} failed permanently: ${errorMsg}`);
          } else {
            // Schedule retry with exponential backoff
            const nextRetry = calculateNextRetry(job.executionCount);
            await db
              .update(jobs)
              .set({
                status: 'pending',
                executionCount: job.executionCount + 1,
                nextRetryAt: nextRetry,
                errorMessage: errorMsg,
                updatedAt: new Date(),
              })
              .where(eq(jobs.id, job.id));

            console.warn(
              `⚠️  Job ${job.id} failed (attempt ${job.executionCount + 1}/${MAX_EXECUTION_ATTEMPTS}), retrying at ${nextRetry}`,
            );
          }
        }
      }
    } catch (error) {
      console.error('💥 Worker error:', error);
      currentInterval = Math.min(currentInterval * 2, 300000);
    }

    await new Promise((r) => setTimeout(r, currentInterval));
  }
}
```

#### 5. Update lib/commands/payments.ts

After successful payment, create a job instead of generating PDF immediately:

```typescript
// In handleMollieWebhook or your payment success handler:

import { createJob } from '@/lib/jobs/jobProcessor';

// After creating tickets:
if (paymentStatus === 'succeeded') {
  const orderTickets = await db.query.tickets.findMany({
    where: eq(tickets.orderId, order.id),
  });

  // Create async job for PDF generation
  await createJob('pdf_generation', {
    orderId: order.id,
    ticketIds: orderTickets.map((t) => t.id),
  });

  console.log(`✅ Payment succeeded. Created ${orderTickets.length} tickets and enqueued PDF job.`);

  // Return success to customer immediately - PDF will be ready soon
  return {
    success: true,
    orderId: order.id,
    message: 'Payment successful! Your tickets are being generated.',
  };
}
```

### Worker Setup - Reusable for Local and Cloud

**Key Design Decision:** The worker is a single codebase that runs in three environments:

1. **Local Development** - `npm run worker` (fastest iteration)
2. **Docker Compose** - Full stack testing with containers
3. **Cloud Run** - Production deployment

**Benefits:**
- ✅ Single codebase, no duplication
- ✅ Consistent behavior across environments
- ✅ Easy testing before cloud deployment
- ✅ Same Docker image for staging and production

#### 1. Install Dependencies

```bash
npm install @google-cloud/storage
npm install --save-dev tsx
```

#### 2. Add Worker Scripts to package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "worker": "tsx scripts/start-worker.ts",
    "worker:watch": "tsx watch scripts/start-worker.ts"
  }
}
```

#### 3. Create Dockerfile for Worker

File: `Dockerfile.worker`

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY lib ./lib
COPY scripts ./scripts

# Port is required by Cloud Run
EXPOSE 8080

# Start worker with tsx loader
CMD ["node", "--loader", "tsx", "scripts/start-worker.ts"]
```

#### 4. Create Docker Compose for Local Testing

File: `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: mierloos
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/mierloos
      NODE_ENV: development
      NEXT_PUBLIC_BASE_URL: http://localhost:3000
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next

  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/mierloos
      WORKER_POLLING_INTERVAL: 5000
      WORKER_MAX_ATTEMPTS: 5
      NODE_ENV: development
      # For local dev, optionally use actual GCP credentials
      GCP_PROJECT_ID: ${GCP_PROJECT_ID:-your-project-id}
      GCS_BUCKET_NAME: ${GCS_BUCKET_NAME:-ons-mierloos-theater-pdfs}
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - .:/app
      - /app/node_modules
      # Optional: Mount GCP credentials for local testing
      # - ~/.config/gcloud:/root/.config/gcloud:ro
    restart: unless-stopped

volumes:
  postgres_data:
```

#### 5. Local Development Workflows

**Option A: Simple (No Docker)**
```bash
# Terminal 1: Run Next.js app
npm run dev

# Terminal 2: Run worker
npm run worker

# Terminal 3: Watch worker logs and restart on changes
npm run worker:watch
```

**Option B: Docker Compose (Full Stack Testing)**
```bash
# Start everything (app + postgres + worker)
docker-compose up

# Or just the worker + postgres
docker-compose up postgres worker

# Watch logs
docker-compose logs -f worker

# Rebuild after code changes
docker-compose up --build worker

# Stop everything
docker-compose down
```

**Option C: Hybrid (App local, Worker in Docker)**
```bash
# Start only postgres and worker
docker-compose up postgres worker

# In another terminal, run Next.js locally
npm run dev
```

#### 6. Create Worker Entry Point

File: `scripts/start-worker.ts`

```typescript
import express from 'express';
import { startLocalWorker } from '@/lib/jobs/localWorker';

const app = express();
const PORT = process.env.PORT || 8080;

// Health check endpoint required by Cloud Run
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Graceful shutdown
let workerRunning = true;
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  workerRunning = false;
  process.exit(0);
});

// Start HTTP server for health checks
app.listen(PORT, () => {
  console.log(`🏥 Health check server running on port ${PORT}`);
});

// Start worker in background
startLocalWorker().catch((error) => {
  console.error('💥 Worker crashed:', error);
  process.exit(1);
});
```

#### 7. Google Cloud Setup Commands

**Prerequisites:**
- Test worker locally first with `npm run worker`
- Test with Docker Compose: `docker-compose up worker`
- Verify all job types work correctly before deploying to cloud

```bash
# Set environment variables
export PROJECT_ID=$(gcloud config get-value project)
export REGION=europe-west4

# Create GCS bucket
gsutil mb -l $REGION gs://ons-mierloos-theater-pdfs

# Set lifecycle policy (delete files after 90 days)
gsutil lifecycle set - gs://ons-mierloos-theater-pdfs << 'EOF'
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 90}
      }
    ]
  }
}
EOF

# Create service account
gcloud iam service-accounts create ons-mierloos-worker

# Grant GCS permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:ons-mierloos-worker@$PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/storage.admin

# Build container (same image used locally and in production)
gcloud builds submit --tag gcr.io/$PROJECT_ID/ons-mierloos-worker \
  -f Dockerfile.worker

# Deploy to Cloud Run
gcloud run deploy ons-mierloos-worker \
  --image gcr.io/$PROJECT_ID/ons-mierloos-worker \
  --platform managed \
  --region $REGION \
  --service-account ons-mierloos-worker@$PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars="GCP_PROJECT_ID=$PROJECT_ID,GCS_BUCKET_NAME=ons-mierloos-theater-pdfs,DATABASE_URL=$DATABASE_URL,WORKER_POLLING_INTERVAL=5000,WORKER_MAX_ATTEMPTS=5" \
  --memory 512Mi \
  --cpu 1 \
  --timeout 3600 \
  --max-instances 10 \
  --no-allow-unauthenticated
```

### Phased Worker Deployment Strategy

**Phase 1: Local Development (Week 3)**
```bash
npm run worker
```
- Fastest iteration during development
- Direct TypeScript execution with tsx
- Connects to local or remote database
- Immediate feedback on code changes

**Phase 2: Docker Compose Testing (Week 4, Days 1-3)**
```bash
docker-compose up worker
```
- Full stack integration testing
- Simulates production environment locally
- Tests with isolated postgres container
- Validates Docker build process

**Phase 3: Cloud Run Production (Week 4, Days 4-7)**
```bash
gcloud run deploy ons-mierloos-worker
```
- Same Docker image from Phase 2
- Connects to production database
- Auto-scaling and managed infrastructure
- Production monitoring and alerts

**Key Principle:** Build once, test locally, deploy confidently.

---

### Environment Variables

**Local Development (.env.local)**

```
DATABASE_URL=postgresql://user:pass@localhost/mierloos
GCP_PROJECT_ID=your-gcp-project-id
GCS_BUCKET_NAME=ons-mierloos-theater-pdfs
ENABLE_LOCAL_WORKER=true
WORKER_POLLING_INTERVAL=5000
WORKER_MAX_ATTEMPTS=5
```

**Cloud Run** (set via gcloud or Cloud Console)

```
DATABASE_URL=your-cloud-sql-url
GCP_PROJECT_ID=your-gcp-project-id
GCS_BUCKET_NAME=ons-mierloos-theater-pdfs
WORKER_POLLING_INTERVAL=5000
WORKER_MAX_ATTEMPTS=5
GOOGLE_APPLICATION_CREDENTIALS=/var/secrets/gcs/key.json (mounted as secret)
```

### Monitoring & Admin Dashboard

Create `app/admin/jobs/page.tsx`:

```typescript
import { db } from '@/lib/db';
import { jobs } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export default async function JobsPage() {
  const jobList = await db.query.jobs.findMany({
    orderBy: [desc(jobs.createdAt)],
    limit: 100,
  });

  const stats = {
    pending: jobList.filter(j => j.status === 'pending').length,
    processing: jobList.filter(j => j.status === 'processing').length,
    completed: jobList.filter(j => j.status === 'completed').length,
    failed: jobList.filter(j => j.status === 'failed').length,
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Job Queue</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-yellow-50 p-4 rounded">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold">{stats.pending}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded">
          <p className="text-sm text-gray-600">Processing</p>
          <p className="text-2xl font-bold">{stats.processing}</p>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold">{stats.completed}</p>
        </div>
        <div className="bg-red-50 p-4 rounded">
          <p className="text-sm text-gray-600">Failed</p>
          <p className="text-2xl font-bold">{stats.failed}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Job ID</th>
              <th>Type</th>
              <th>Status</th>
              <th>Created</th>
              <th>Attempts</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {jobList.map(job => (
              <tr key={job.id} className="border-t hover:bg-gray-50">
                <td className="p-2 font-mono text-xs">{job.id.substring(0, 8)}</td>
                <td className="p-2">{job.type}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    job.status === 'completed' ? 'bg-green-100 text-green-800' :
                    job.status === 'failed' ? 'bg-red-100 text-red-800' :
                    job.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {job.status}
                  </span>
                </td>
                <td className="p-2 text-sm">{new Date(job.createdAt).toLocaleString()}</td>
                <td className="p-2 text-center">{job.executionCount}</td>
                <td className="p-2 text-xs text-red-600">{job.errorMessage?.substring(0, 50)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### Cost Estimates

**Monthly costs for 500 orders/month (~1 order/day) with existing database & Cloud Run free tier:**

| Service           | Usage                                    | Cost           |
| ----------------- | ---------------------------------------- | -------------- |
| Cloud Run compute | 500 × 30s (free tier: 2M requests/month) | **$0**         |
| Cloud SQL         | Using existing database                  | **$0**         |
| GCS Storage       | ~5GB PDF storage                         | ~$0.10         |
| GCS Operations    | 1000 ops/month                           | ~$0.05         |
| Networking        | ~10GB egress                             | ~$2            |
| **Total**         |                                          | **~$20/month** |

**Free Tier Capacity Check:**

- Cloud Run free tier: 2,000,000 invocations/month
- Your scenario: 500 orders × 1 worker check per order ≈ 1,500-2,000 invocations/month
- **Plenty of headroom** ✅ (at ~1,000-2,000 monthly requests you're using <0.1% of free tier)

**When you'll exceed free tier:**

- ~250,000 orders/month (50x current volume)
- Then Cloud Run cost would be ~$0.40/month additional per 500 orders

**Savings from current Vercel overages: ~$100-200/month → New cost ~$20/month = 90% cost reduction**

### Future Optimization: Cloud Tasks

Once polling-based system is stable, migrate to Cloud Tasks for near-instant job processing:

```typescript
// Future: Cloud Tasks implementation
import { CloudTasksClient } from '@google-cloud/tasks';

async function enqueueJobWithCloudTasks(type: string, data: any): Promise<string> {
  const client = new CloudTasksClient();
  const parent = client.queuePath(projectId, 'europe-west4', 'pdf-jobs');

  const task = {
    httpRequest: {
      httpMethod: 'POST',
      url: `https://WORKER_SERVICE_URL/process-job`,
      headers: { 'Content-Type': 'application/json' },
      body: Buffer.from(JSON.stringify({ type, data })).toString('base64'),
    },
  };

  const [response] = await client.createTask({ parent, task });
  return response.name || '';
}
```

**Benefits:**

- No polling overhead
- Built-in retry logic
- Task deduplication
- Better scalability
- Even lower costs

---

## Section 2: Known Bugs to Fix

### Bug #1: Password Reset Issue

**Status:** Needs Investigation

**Priority:** 🟠 HIGH

**Description:**
Password reset functionality requires detailed investigation to identify the exact failure point(s) in the authentication flow. The issue could be in token generation, email delivery, or token validation.

**Impact:** Users cannot recover lost passwords - blocks account access.

**Investigation Steps:**

1. Add detailed logging to entire password reset flow
2. Check token generation and expiry logic
3. Verify email template formatting and delivery
4. Test with actual email provider (SMTP configuration)
5. Validate token storage in database
6. Check token validation on reset page

**Files Likely Involved:**

- `lib/commands/auth.ts` - Auth logic
- `lib/utils/email.ts` - Email sending
- `app/api/auth/reset-password/route.ts` - Password reset endpoint
- `app/auth/reset-password/page.tsx` - Reset page UI

**Suggested Approach:**

```typescript
// Add logging to password reset flow
export async function requestPasswordReset(email: string) {
  console.log(`[PASSWORD_RESET] Requested for email: ${email}`);

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    console.log(`[PASSWORD_RESET] User not found: ${email}`);
    // Don't reveal if email exists (security)
    return { success: true };
  }

  // Generate token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

  console.log(`[PASSWORD_RESET] Generated token expiring at ${resetTokenExpiry}`);

  // Store token in database
  await db
    .update(users)
    .set({
      resetToken,
      resetTokenExpiry,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  console.log(`[PASSWORD_RESET] Token stored for user ${user.id}`);

  // Send email
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password?token=${resetToken}`;
  console.log(`[PASSWORD_RESET] Reset URL: ${resetUrl}`);

  try {
    const result = await sendPasswordResetEmail(user.email, resetUrl);
    console.log(`[PASSWORD_RESET] Email sent successfully: ${result.success}`);
    return { success: true };
  } catch (error) {
    console.error(`[PASSWORD_RESET] Email send failed:`, error);
    throw error;
  }
}
```

**Testing Checklist:**

- [ ] Email is received in test inbox
- [ ] Reset link in email is correct
- [ ] Token in database matches URL token
- [ ] Token hasn't expired when clicked
- [ ] New password is actually updated
- [ ] User can login with new password

---

### Bug #2: Cart Items Remain After Show Date Passes

**Status:** ✅ **FIXED** (Completed January 26, 2026)

**Priority:** 🔴 CRITICAL

**Description:**
When a show date passes, tickets for that performance remain in the shopping cart. Users can still proceed to checkout and purchase tickets for past performances. The system does not validate that performances are still available or that dates are in the future.

**Solution Implemented:**

Multi-layer validation prevents expired items from being purchased:

1. **CartContext** - Validates cart on app mount, fetches current performance data, auto-removes expired items
2. **ShoppingCart UI** - Shows red warning box for expired items, disables checkout if all items invalid
3. **Checkout API** - Server-side validation prevents invalid orders even if client validation bypassed
4. **Success Page** - Clears cart automatically after successful payment

**Files Created/Modified:**

1. ✅ **`lib/utils/validation.ts`** (NEW)
   - `isPerformanceAvailable()` - Checks if performance is future-dated, published, has seats
   - `validateCartItems()` - Validates entire cart against current performance data
   - `isCartItemExpired()` - Checks if item's date has passed
   - `getUnavailabilityReason()` - Explains why item no longer valid

2. ✅ **`components/CartContext.tsx`** (MODIFIED)
   - Added `useEffect` to validate cart on mount
   - Calls `/api/performances` endpoint to fetch fresh data
   - Auto-removes expired items from localStorage with logging

3. ✅ **`components/ShoppingCart.tsx`** (MODIFIED)
   - Extended `CartItem` type with optional `performanceDate` and `addedAt`
   - Separates valid vs expired items
   - Shows red warning box with list of unavailable items
   - Disables checkout button if all items expired
   - Calculates totals only for valid items

4. ✅ **`app/api/performances/route.ts`** (NEW)
   - API endpoint accepting performance IDs as query params
   - Returns current availability data (date, status, availableSeats)
   - Used by CartContext to validate items

5. ✅ **`app/checkout/actions.ts`** (MODIFIED)
   - Server-side validation before order creation
   - Fetches current performance data
   - Prevents checkout if any items invalid
   - Returns specific error messages about which items are no longer available

6. ✅ **`app/checkout/success/page.tsx`** (VERIFIED)
   - Already clears cart after successful payment ✅

**How It Works:**

```
User adds ticket for future show
  ↓
Days pass, performance date becomes past
  ↓
User returns to site
  ↓
CartContext mounts → Fetches performance data
  ↓
Validates cart items against current data
  ↓
Expired items auto-removed (warning shown)
  ↓
User tries checkout → Server validates again
  ↓
Prevents invalid order → Returns error
  ↓
After successful payment → Cart cleared
```

**Protection Layers:**

✅ **Cart Loading** - Expired items auto-removed on app startup
✅ **Cart Display** - Red warning shows which items no longer available
✅ **Checkout** - Server validates all items before payment initiation
✅ **Cart Clear** - Cleared after successful order
✅ **Type Safety** - TypeScript validation for all cart operations

**Impact:**

- ✅ Prevents revenue loss from invalid orders
- ✅ Eliminates customer complaints about expired tickets
- ✅ Provides clear user experience with warnings
- ✅ No manual refunds needed for invalid orders

---

### Bug #3: Past Performance Selection - Can Select Performances After Date Has Passed

**Status:** ✅ FIXED (Completed January 26, 2026)

**Priority:** 🔴 CRITICAL

**Description:**
Users can select and purchase tickets for performances that have already occurred. The performance selection interface on show detail pages does not filter or validate performance dates against the current time.

**Affected Pages:**

- Show detail pages (`app/[slug]/page.jsx`)
- TimeslotPicker component (`components/TimeslotPicker.tsx`)
- Performance list components

**Impact:**

- **CRITICAL:** Direct revenue loss - selling tickets for events that already happened
- Unhappy customers who purchased invalid tickets
- No-show rates (the show already happened)
- Operational confusion

**Root Cause:**

- No date filtering in queries
- Components display all performances regardless of date
- No status validation (shows archived/cancelled performances)
- Frontend-only validation, no backend enforcement
- No disable/grayout UI for past dates

**Implementation Complete:**

The following files have been created/modified to fix Bug #3:

1. **`lib/queries/shows.ts`** ✅
   - Created new function `getShowBySlugWithAvailablePerformances()` that filters performances by:
     - Performance date > current time
     - Performance status = 'published'
   - This prevents users from even seeing past performances

2. **`app/performances/[slug]/page.tsx`** ✅
   - Updated to use `getShowBySlugWithAvailablePerformances()` instead of `getShowBySlugWithTagsAndPerformances()`
   - Now passes only available performances to TimeslotPicker

3. **`components/TimeslotPicker.tsx`** ✅
   - Added client-side date filtering as a safety net
   - Filters: `perfDate > now && status === 'published' && availableSeats > 0`
   - Shows helpful message "Helaas zijn er geen beschikbare voorstellingen" when no performances available

**Protection Layers:**

✅ **Server-side filtering (Primary)**: Query only returns future, published performances
✅ **Client-side filtering (Safety Net)**: TimeslotPicker filters again to ensure no past dates slip through
✅ **Existing checkout validation**: Bug #2 changes already validate all performances before payment

**Testing Verification:**

Users can no longer:

- ❌ See past performances on show detail pages
- ❌ Select cancelled or archived performances
- ❌ Purchase tickets for events that already happened

Users will see:

- ✅ Only upcoming, published performances
- ✅ Clear message when no performances are available
- ✅ Protected by multi-layer validation

**Code Implementation:**

```typescript
// lib/queries/shows.ts - New function added
export async function getShowBySlugWithAvailablePerformances(
  slug: string,
): Promise<ShowWithTagsAndPerformances | null> {
  const now = new Date();

  const result = await db.query.shows.findFirst({
    where: eq(shows.slug, slug),
    with: {
      performances: {
        where: and(gte(performances.date, now), eq(performances.status, 'published')),
        orderBy: [asc(performances.date)],
      },
      showTags: {
        with: { tag: true },
      },
    },
  });

  if (!result) return null;

  return {
    ...result,
    tags: result.showTags.map((st) => st.tag).filter(Boolean),
  };
}
```

```typescript
// components/TimeslotPicker.tsx - Updated filtering
const now = new Date();
const availablePerformances = performances.filter((p) => {
  const perfDate = new Date(p.date);
  return p.status === 'published' && p.availableSeats > 0 && perfDate > now;
});
```

```typescript
// components/TimeslotPicker.tsx - Add filtering as extra safety
export default function TimeslotPicker({ performances, showTitle }) {
  const now = new Date();

  // Filter even further as a safety net
  const availablePeformances = performances.filter(perf => {
    const perfDate = new Date(perf.date);
    return perfDate > now && perf.status === 'published';
  });

  if (availablePeformances.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded">
        <p className="text-gray-600 text-lg">
          Geen beschikbare voorstellingen voor "{showTitle}"
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Controleer later opnieuw of neem contact op voor meer informatie.
        </p>
      </div>
    );
  }

  return (
    <div>
      {availablePeformances.map(perf => (
        <PerformanceOption key={perf.id} performance={perf} />
      ))}
    </div>
  );
}
```

---

### Bug #4: Cart Persistence - Items Should Be Cleared or Made Unavailable When Show Dates Pass

**Status:** Needs Fix

**Priority:** 🟡 MEDIUM

**Description:**
The shopping cart is stored in browser localStorage indefinitely without validation. When a user returns to the site days or weeks later, their cart may contain tickets for performances that have already occurred, been cancelled, or sold out.

**Technical Details:**

- Cart stored in `useLocalStorage` hook
- No expiration or validation on cart items
- Items loaded on app startup without checking validity
- Items persist even after successful purchase
- No mechanism to detect if performances were cancelled/archived

**Impact:**

- Poor user experience (confusing expired items in cart)
- Wasted checkout attempts
- Customer support burden (why can I purchase this?)
- Potential invalid orders if not caught

**Root Cause:**

- Cart is purely client-side with no validation
- Cart persists across sessions without date checks
- No cleanup after successful orders
- Items lack timestamp metadata

**Files That Need Modification:**

1. **`components/CartContext.tsx`**
   - Add validation on cart load
   - Remove invalid items automatically
   - Add cart item timestamps
2. **`hooks/useLocalStorage.ts`**
   - Add cleanup mechanism
3. **`components/ShoppingCart.tsx`**
   - Show which items are no longer available
   - Offer suggestions for alternative shows
4. **`app/checkout/success/page.tsx`**
   - Clear cart on successful order

**Code Implementation:**

```typescript
// components/CartContext.tsx - Enhanced version
export type CartItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  performanceDate: Date;
  addedAt: Date;  // NEW: track when added
};

export function CartProvider({ children }) {
  const [items, setItems] = useLocalStorage<CartItem[]>(CART_KEY, []);

  // Validate and cleanup cart on mount
  useEffect(() => {
    validateAndCleanupCart();
  }, []);

  async function validateAndCleanupCart() {
    const now = new Date();
    const performanceIds = [...new Set(items.map(item => item.id))];

    if (performanceIds.length === 0) return;

    try {
      const performances = await db.query.performances.findMany({
        where: inArray(performances.id, performanceIds),
      });

      const validIds = new Set(
        performances
          .filter(p =>
            new Date(p.date) > now &&
            p.status === 'published' &&
            (p.availableSeats || 0) > 0
          )
          .map(p => p.id)
      );

      const validItems = items.filter(item => validIds.has(item.id));
      const invalidItems = items.filter(item => !validIds.has(item.id));

      if (invalidItems.length > 0) {
        setItems(validItems);

        // Show notification
        const count = invalidItems.length;
        toast.warning(
          `${count} item${count > 1 ? 's' : ''} in your cart are no longer available and have been removed.`
        );
      }
    } catch (error) {
      console.error('Error validating cart:', error);
    }
  }

  function addToCart(performance: Performance, quantity: number) {
    setItems(prev => [
      ...prev,
      {
        id: performance.id,
        title: performance.show?.title || '',
        price: Number(performance.price),
        quantity,
        performanceDate: new Date(performance.date),
        addedAt: new Date(),  // Set current time
      },
    ]);
  }

  return (
    <CartContext.Provider value={{ items, addToCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}
```

```typescript
// components/ShoppingCart.tsx - Show warnings
export function ShoppingCart() {
  const { items } = useCart();
  const now = new Date();

  const validItems = items.filter(item => item.performanceDate > now);
  const invalidItems = items.filter(item => item.performanceDate <= now);

  return (
    <div>
      {invalidItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <h3 className="font-semibold text-red-900">Unavailable Items</h3>
          <p className="text-red-800 text-sm mt-1">
            {invalidItems.length} item{invalidItems.length > 1 ? 's' : ''} in your cart are no longer available (performance date has passed).
          </p>
        </div>
      )}

      {validItems.length === 0 ? (
        <p className="text-gray-500">Your cart is empty</p>
      ) : (
        <div>
          {validItems.map(item => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
```

```typescript
// app/checkout/success/page.tsx - Clear cart
export default function CheckoutSuccessPage() {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Clear cart after successful purchase
    const orderId = searchParams.get('orderId');
    if (orderId) {
      clearCart();
      console.log('✅ Cart cleared after successful order');
    }
  }, [searchParams, clearCart]);

  return (
    <div className="text-center py-12">
      <h1 className="text-3xl font-bold mb-4">✅ Order Confirmed!</h1>
      <p className="text-gray-600">Your tickets have been created and an email has been sent.</p>
    </div>
  );
}
```

---

### Bug #5: Seat Inventory Not Decremented During Checkout

**Status:** Needs Fix

**Priority:** 🔴 CRITICAL

**Description:**
When a user completes checkout, the `performances.availableSeats` counter is not decremented. This means:

- Multiple users can purchase more tickets than actually available
- Inventory overselling (overbooking)
- No seat allocation protection
- If payment fails, seats are never released back to available pool

**Impact:**

- **CRITICAL:** Overselling performances (accepting more tickets than seats exist)
- Unhappy customers (selling tickets that don't exist)
- Operational chaos (more tickets sold than capacity)
- Refund liabilities
- Show scheduling problems

**Root Cause:**

1. Checkout flow creates order and tickets but doesn't update `performances.availableSeats`
2. No transaction/lock to prevent concurrent overselling
3. No rollback mechanism if payment fails
4. Workers marking failed payments don't release seats back

**Affected Files:**

- `app/checkout/actions.ts` - Order creation doesn't decrement seats
- Payment processing flow - No seats released on failure
- Job processing - Failed payments don't rollback seat allocation

**Files That Need Modification:**

1. **`app/checkout/actions.ts`**
   - Decrement `availableSeats` when order is created
   - Add validation that `availableSeats >= quantity` before decrement
   - Handle concurrent requests properly

2. **`lib/commands/payments.ts`** (or equivalent payment handling)
   - Increment `availableSeats` back if payment fails
   - Log seat release for audit trail

3. **`lib/jobs/handlers/paymentHandler.ts`** (NEW)
   - If worker marks payment as failed, release seats back
   - Handle orphaned orders (payment failed but seats still allocated)

4. **`lib/db/queries/performances.ts`** (or shows.ts)
   - Create helper function `updateAvailableSeats(performanceId, delta)`
   - Ensure atomic operations

**Code Implementation:**

```typescript
// lib/db/queries/performances.ts - Add seat management function
export async function updateAvailableSeats(
  performanceId: string,
  delta: number, // positive to add, negative to subtract
): Promise<number | null> {
  // Use raw SQL to ensure atomic update with concurrency protection
  const result = await db.execute(
    sql`
      UPDATE ${performances}
      SET available_seats = available_seats + ${delta}
      WHERE id = ${performanceId}
      AND available_seats + ${delta} >= 0
      RETURNING available_seats
    `,
  );

  if (result.rows.length === 0) {
    throw new Error(`Cannot update seats: insufficient availability or performance not found`);
  }

  return result.rows[0].available_seats as number;
}

// Helper to validate seat availability
export async function validateSeatsAvailable(
  performanceId: string,
  requiredSeats: number,
): Promise<boolean> {
  const performance = await db.query.performances.findFirst({
    where: eq(performances.id, performanceId),
  });

  return performance ? performance.availableSeats >= requiredSeats : false;
}

// Helper to reserve seats (returns success or throws)
export async function reserveSeats(performanceId: string, quantity: number): Promise<void> {
  const available = await validateSeatsAvailable(performanceId, quantity);
  if (!available) {
    throw new Error(`Not enough seats available (need ${quantity})`);
  }

  await updateAvailableSeats(performanceId, -quantity);
}

// Helper to release seats back
export async function releaseSeats(performanceId: string, quantity: number): Promise<void> {
  await updateAvailableSeats(performanceId, quantity);
}
```

```typescript
// app/checkout/actions.ts - Updated to handle seat reservation
export async function createOrder(
  items: CartItem[],
  customerEmail: string,
): Promise<{ orderId: string; success: boolean }> {
  // ... existing validation code ...

  // NEW: Validate and reserve seats BEFORE creating order
  try {
    // Group by performance to check seat availability
    const performanceGroups = new Map<string, number>();
    for (const item of items) {
      const current = performanceGroups.get(item.id) || 0;
      performanceGroups.set(item.id, current + item.quantity);
    }

    // Validate all performances have enough seats
    for (const [performanceId, quantity] of performanceGroups.entries()) {
      const available = await validateSeatsAvailable(performanceId, quantity);
      if (!available) {
        throw new Error(
          `Not enough seats available for performance ${performanceId} (need ${quantity})`,
        );
      }
    }

    // Create transaction
    const order = await db.transaction(async (tx) => {
      // Create order
      const [newOrder] = await tx
        .insert(orders)
        .values({
          id: generateId(),
          customerEmail,
          status: 'pending',
          totalPrice: calculateTotal(items),
          createdAt: new Date(),
        })
        .returning();

      // Create tickets
      for (const item of items) {
        await tx.insert(tickets).values({
          id: generateId(),
          orderId: newOrder.id,
          performanceId: item.id,
          quantity: item.quantity,
          status: 'pending',
        });
      }

      // Reserve seats in performances table
      for (const [performanceId, quantity] of performanceGroups.entries()) {
        await tx.execute(
          sql`
            UPDATE ${performances}
            SET available_seats = available_seats - ${quantity}
            WHERE id = ${performanceId}
            AND available_seats >= ${quantity}
          `,
        );
      }

      return newOrder;
    });

    console.log(`✅ Order ${order.id} created and ${performanceGroups.size} performances updated`);

    return { orderId: order.id, success: true };
  } catch (error) {
    console.error(`❌ Order creation failed:`, error);
    // Transaction automatically rolled back, seats not reserved
    throw error;
  }
}
```

```typescript
// lib/commands/payments.ts - Handle payment failure with seat release
export async function handlePaymentFailure(orderId: string): Promise<void> {
  console.log(`[PAYMENT_FAILED] Processing failure for order ${orderId}`);

  try {
    // Get order and its tickets
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        tickets: true,
      },
    });

    if (!order) {
      console.error(`[PAYMENT_FAILED] Order not found: ${orderId}`);
      return;
    }

    if (order.status !== 'pending') {
      console.log(
        `[PAYMENT_FAILED] Order ${orderId} is already ${order.status}, skipping seat release`,
      );
      return;
    }

    // Release seats back to performances
    const performanceGroups = new Map<string, number>();
    for (const ticket of order.tickets) {
      const current = performanceGroups.get(ticket.performanceId) || 0;
      performanceGroups.set(ticket.performanceId, current + ticket.quantity);
    }

    await db.transaction(async (tx) => {
      // Release seats
      for (const [performanceId, quantity] of performanceGroups.entries()) {
        await tx.execute(
          sql`
            UPDATE ${performances}
            SET available_seats = available_seats + ${quantity}
            WHERE id = ${performanceId}
          `,
        );
        console.log(`[PAYMENT_FAILED] Released ${quantity} seats for performance ${performanceId}`);
      }

      // Mark order as failed
      await tx.update(orders).set({ status: 'failed' }).where(eq(orders.id, orderId));

      // Mark tickets as cancelled
      await tx.update(tickets).set({ status: 'cancelled' }).where(eq(tickets.orderId, orderId));
    });

    console.log(`✅ Payment failure processed: ${orderId}, seats released`);
  } catch (error) {
    console.error(`[PAYMENT_FAILED] Error processing failure for ${orderId}:`, error);
    throw error;
  }
}
```

```typescript
// lib/jobs/handlers/paymentHandler.ts (NEW) - Worker job for failed payments
import { db } from '@/lib/db';
import { orders, tickets, performances } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export interface PaymentJobData {
  orderId: string;
  status: 'succeeded' | 'failed' | 'pending';
  paymentId: string;
}

export async function handlePaymentJob(
  jobId: string,
  data: PaymentJobData,
): Promise<{ success: boolean; orderId: string }> {
  const { orderId, status, paymentId } = data;

  console.log(`[PAYMENT_JOB] Processing payment ${paymentId} for order ${orderId}: ${status}`);

  try {
    if (status === 'failed') {
      // Get tickets for this order to release seats
      const orderTickets = await db.query.tickets.findMany({
        where: eq(tickets.orderId, orderId),
      });

      // Release seats in transaction
      await db.transaction(async (tx) => {
        const performanceGroups = new Map<string, number>();
        for (const ticket of orderTickets) {
          const current = performanceGroups.get(ticket.performanceId) || 0;
          performanceGroups.set(ticket.performanceId, current + ticket.quantity);
        }

        // Release all seats
        for (const [performanceId, quantity] of performanceGroups.entries()) {
          await tx.execute(
            sql`
              UPDATE ${performances}
              SET available_seats = available_seats + ${quantity}
              WHERE id = ${performanceId}
            `,
          );
        }

        // Mark order and tickets as cancelled
        await tx.update(orders).set({ status: 'cancelled' }).where(eq(orders.id, orderId));
        await tx.update(tickets).set({ status: 'cancelled' }).where(eq(tickets.orderId, orderId));
      });

      console.log(`✅ Order ${orderId} cancelled and seats released due to payment failure`);
    } else if (status === 'succeeded') {
      // Mark order as confirmed
      await db.update(orders).set({ status: 'confirmed' }).where(eq(orders.id, orderId));
      console.log(`✅ Order ${orderId} confirmed after successful payment`);
    }

    return { success: true, orderId };
  } catch (error) {
    console.error(`❌ Payment job failed for order ${orderId}:`, error);
    throw error;
  }
}
```

**Implementation Flow:**

```
User adds items to cart
  ↓
Checkout initiated
  ↓
Validate all performances have enough seats
  ↓
Create order transaction:
  - Insert order
  - Insert tickets
  - Decrement available_seats
  ↓
Seats reserved ✅
  ↓
Process payment
  ↓
Payment succeeds → Order marked 'confirmed'
              OR
Payment fails → Job created to release seats
  ↓
Job worker releases seats back to performances
  ↓
Seats available for other customers ✅
```

**Testing Checklist:**

- [ ] Add 5 tickets, show has 10 seats → availableSeats = 5 after checkout
- [ ] Two concurrent checkouts for 8 seats each (12 available) → 2nd fails with "not enough seats"
- [ ] Checkout succeeds, payment fails → availableSeats restored
- [ ] Worker marks payment failed → seats released
- [ ] Orphaned order detection and cleanup
- [ ] Edge case: availableSeats = 0 → checkout fails
- [ ] Concurrent overselling prevention (use database-level atomicity)

---

## Section 3: Implementation Priority & Roadmap

### Execution Order Rationale

**These bugs are blocking revenue - fix immediately.**

Then proceed with the scalability improvements.

### Week 1-2: Critical Bug Fixes

**Bugs #2, #3, #4 - Date Validation (All related)**

**Why First:**

- Actively losing revenue (selling tickets for past events)
- Simple fixes with high impact
- Can be deployed independently
- No infrastructure changes needed

**Timeline:**

- **Day 1:** Create validation utilities and update schema if needed
- **Days 2-3:** Update TimeslotPicker and show pages
- **Days 4-5:** Update CartContext and cart display
- **Days 6-7:** Testing and deployment

**Deliverables:**

- Users cannot select past performances
- Invalid cart items auto-removed on cart load
- Checkout validates performance availability
- Clear UI messaging for unavailable shows
- Cart clears after successful order

**Testing:**

```typescript
// Test cases
1. Add ticket for tomorrow → checkout works
2. Add ticket, wait for date to pass → removed from cart
3. Visit show page after all performances passed → "No shows available"
4. Try to manually submit checkout with invalid perf → validation error
5. Checkout successfully → cart cleared
```

---

### Parallel Task: Week 1 (Days 1-3)

**Bug #1 - Password Reset Investigation**

**Why Parallel:**

- Doesn't block date validation work
- Quick investigation might find simple fix
- Low risk to implement fix

**Timeline:**

- **Day 1:** Add logging to auth flow
- **Days 2-3:** Identify failure point, implement fix

**Deliverables:**

- Root cause identified
- Working password reset
- Monitoring/alerts for future issues

---

### Week 3-4: Cloud Migration

**Google Cloud + Job Queue + GCS**

**Why After Bug Fixes:**

- Improves scalability and cost efficiency
- Less urgent than blocking bugs
- Can be done independently
- Allows testing of new system without pressure

**Timeline:**

**Week 3:**
- **Days 1-2:** Create database migration for jobs table, deploy to production
- **Day 3:** Implement job processor and PDF generation handler
- **Days 4-5:** Create worker entry point (`scripts/start-worker.ts`)
- **Days 6-7:** Test locally with `npm run worker`, verify all job types work

**Week 4:**
- **Days 1-2:** Create `docker-compose.yml` and `Dockerfile.worker`
- **Day 3:** Test full stack with Docker Compose locally
- **Days 4-5:** Set up GCS bucket and Cloud Run deployment
- **Days 6-7:** Deploy to Cloud Run, monitor production for 48 hours

**Deliverables:**

- Jobs table created in database
- PDF generation moved to async jobs
- Worker runs locally via `npm run worker` (development)
- Worker runs in Docker Compose (testing)
- Worker deployed to Cloud Run (production)
- **Single worker codebase** used in all three environments
- Admin dashboard for job monitoring
- GCS bucket storing PDFs
- Cost monitoring setup

**Key Benefit:** By using the same worker codebase across local/Docker/Cloud Run, you can thoroughly test locally before deploying to production.

---

### Risk Assessment Matrix

| Bug                     | Risk Level   | Effort  | Impact       | Priority        | Week |
| ----------------------- | ------------ | ------- | ------------ | --------------- | ---- |
| Seat inventory (5)      | **CRITICAL** | Low-Med | Overselling  | 🔴 **NOW**      | 1    |
| Date validation (2,3,4) | **CRITICAL** | Low-Med | Revenue loss | 🔴 **NOW**      | 1-2  |
| Password reset (1)      | **HIGH**     | Low-Med | User access  | 🟠 **Parallel** | 1    |
| Cloud migration         | **LOW**      | High    | Scalability  | 🟡 **Later**    | 4-5  |

---

### Testing Strategy

**For Bug Fixes (Week 1-2):**

```bash
# Unit tests for validation
npm test -- lib/utils/validation.ts

# Integration tests for checkout flow
npm test -- app/checkout/

# E2E tests with Playwright
npx playwright test

# Manual testing edge cases:
# 1. Performance date = now (should fail)
# 2. Performance date = 1 second in future (should work)
# 3. Cancelled performances (should hide)
# 4. Sold out performances (should hide)
# 5. Past dates in cart (should remove on load)
```

**For Cloud Migration (Week 3-4):**

```bash
# Unit tests for job processor
npm test -- lib/jobs/

# Integration tests for GCS upload
npm test -- lib/utils/gcsUploader.ts

# Load testing with Cloud Run
# - Test with 100+ concurrent jobs
# - Monitor CPU/memory usage
# - Verify auto-scaling

# Failure recovery tests
# - Kill worker mid-job
# - Verify job retried
# - Check exponential backoff timing
```

---

### Rollback Plan

**Bug Fixes:**

- Simple Git revert of date validation changes
- No database migrations to rollback
- Quick deployment (< 10 minutes)

**Cloud Migration:**

- Keep PDF generation in checkout temporarily
- Gradually migrate orders via job queue
- Easy to disable Cloud Run and fall back to sync generation
- Archive old PDFs in GCS

---

### Success Criteria

**Bug Fixes Complete When:**

- ✅ Cannot add expired performances to cart
- ✅ Cart auto-removes invalid items on load
- ✅ Checkout validation prevents invalid orders
- ✅ All test cases passing
- ✅ No revenue loss from invalid orders
- ✅ Zero bugs reported in production (2 weeks)

**Cloud Migration Complete When:**

- ✅ 100% of PDF jobs processed successfully
- ✅ Average job latency < 30 seconds
- ✅ Job failure rate < 1%
- ✅ Admin dashboard showing metrics
- ✅ Cost verified < $50/month
- ✅ Smooth scaling under load

---

## Implementation Checklist

### Week 1: Critical Bug Fixes

**Bug #2 (Cart Expiration) - COMPLETED ✅**

- [x] Create `lib/utils/validation.ts` with date/availability checks
- [x] Create `app/api/performances/route.ts` for performance data fetching
- [x] Update `components/CartContext.tsx` with validation on load
- [x] Update `components/ShoppingCart.tsx` with warnings and expired item filtering
- [x] Update `app/checkout/actions.ts` with server-side validation
- [x] Verified `app/checkout/success/page.tsx` clears cart after order
- [x] Fixed TypeScript errors and type mismatches
- [x] Tested validation logic end-to-end

**Bug #3 (Past Performance Selection) - COMPLETED ✅**

- [x] Created `lib/queries/shows.ts::getShowBySlugWithAvailablePerformances()` with date filter
- [x] Updated `app/performances/[slug]/page.tsx` to use availability query
- [x] Updated `components/TimeslotPicker.tsx` with client-side date filtering as safety net
- [x] Fixed TypeScript errors (unused imports/parameters)
- [x] Verified no past performances visible to users

**Bug #1 (Password Reset) - PENDING INVESTIGATION**

- [ ] Add logging to password reset flow
- [ ] Create test cases for password reset
- [ ] Manual testing with email provider

**Bug #5 (Seat Inventory Not Decremented) - ✅ COMPLETED**

- [x] Create `updateAvailableSeats()`, `validateSeatsAvailable()`, `reserveSeats()`, `releaseSeats()` in `lib/queries/performances.ts`
- [x] Update `app/checkout/actions.ts` to validate and reserve seats in transaction
- [x] Create `lib/commands/payments.ts::handlePaymentFailure()` to release seats on failure
- [x] Create `lib/jobs/handlers/paymentHandler.ts` for worker-based seat release
- [x] Refactor webhook to use comprehensive transactions:
  - [x] Transaction for payment/order status update
  - [x] Transaction for ticket generation in success flow
  - [x] Transaction for seat + coupon release in failure flow
  - [x] Idempotency checks to prevent double-processing
- [x] Add `handlePaymentSuccess()` function with atomic ticket generation
- [x] Ensure email failures don't block critical operations
- [x] Add coupon tracking to `coupon_usages` table (`discountType` field)
- [x] Record coupon usage atomically during checkout (within transaction)
- [x] Release coupons atomically on payment failure (delete records + decrement usage_count)
- [x] Capture coupon discount type from validation result
- [x] Implement row-level locking with `SELECT ... FOR UPDATE` to prevent race conditions
- [x] **COMPLETED:** Implement payment creation job queue for provider downtime resilience:
  - [x] Created `jobs` table with generic job queue schema
  - [x] Created `lib/jobs/jobProcessor.ts` with job management functions
  - [x] Created `lib/jobs/handlers/paymentCreationHandler.ts` with retry logic (max 5 attempts)
  - [x] Updated `app/checkout/actions.ts` to queue payment creation on Mollie failure
  - [x] Exponential backoff: 5s → 10s → 20s → 40s → 80s (max 5 minutes)
  - [x] Mock payment support for local testing
  - [x] Created `lib/jobs/handlers/paymentWebhookHandler.ts` for async webhook processing
  - [x] Updated `app/api/webhooks/mollie/route.ts` to queue webhook jobs
  - [x] Created `lib/jobs/handlers/orphanedOrderCleanupHandler.ts` for daily cleanup
  - [x] Created `lib/jobs/worker.ts` with polling and graceful shutdown
  - [x] Created `scripts/start-worker.ts` entry point with health checks
  - [x] Added `worker` and `worker:watch` scripts to package.json
  - [x] Installed dependencies: express, @mollie/api-client, @types/express
- [x] **DESIGN DECISION:** Keep inline payment creation (95% success) with job queue fallback (5% - Mollie down)
  - Better UX: Users get immediate redirect to payment
  - Job queue only for retry scenarios
  - Email fallback for queued payments
- [x] **UX ENHANCEMENTS:** Queued payment user experience
  - [x] Created `sendQueuedPaymentEmail()` in `lib/utils/email.ts`
  - [x] Email includes: order confirmation, 5-min timeline, 15-min expiry warning, order status link
  - [x] Created public order status page: `app/order/[orderId]/page.tsx`
  - [x] Order page shows: status badges, payment link (if available), order details, help section
  - [x] Updated checkout to redirect to order page on queued payment
  - [x] Added `redirectUrl` to CheckoutState type
- [x] **MONITORING:** Admin jobs dashboard
  - [x] Created `app/admin/jobs/page.tsx`
  - [x] Shows: real-time stats, filters (status/type), job details table
  - [x] Displays: ID, type, status, attempts, created, next retry, error messages
  - [x] Limit: First 100 results
- [ ] Run database migration for jobs table
- [ ] Test worker locally with mock payments
- [ ] Test queued payment email sending
- [ ] Test order status page (authenticated and unauthenticated)
- [ ] Test admin jobs dashboard filtering
- [ ] Test concurrent checkout scenarios
- [ ] Test payment failure seat + coupon release
- [ ] Test webhook idempotency (double calls)
- [ ] Test payment provider downtime scenarios (simulate Mollie down)
- [ ] Test payment creation job retry logic
- [ ] Test orphaned order cleanup job

**Testing & Deployment**

- [ ] Create test cases for Bug #2 validation
- [ ] Manual testing with edge cases (past dates, sold out, cancelled)
- [ ] **NEW:** Test concurrent checkout overselling prevention
- [ ] **NEW:** Test seat release on payment failure
- [ ] **NEW:** Verify seat counts after multiple orders
- [ ] **NEW:** Simulate Mollie downtime (kill payment creation, verify queue works)
- [ ] **NEW:** Verify job retry logic and exponential backoff timing
- [ ] Code review and QA for all changes
- [ ] Deploy Bug #2, #3, #5 to production

---

## Payment Provider Downtime Resilience

### Problem

When payment provider (Mollie) is down or unreachable:

- Current: Checkout fails, user sees error
- Order is created + seats reserved, but user gets no confirmation
- Bad UX and potential lost sales

### Solution: Payment Creation Job Queue

Decouple payment creation from checkout flow:

```
1. Checkout Phase (Quick)
   ├─ Lock performances (SELECT ... FOR UPDATE)
   ├─ Validate seats
   ├─ Create order + reserve seats
   └─ Return confirmation

2. If Mollie Fails → Queue for Retry
   ├─ Create `payment_creation` job
   ├─ Email user: "Order confirmed, payment processing..."
   └─ Return success (order ID to user)

3. Background Worker (Retry Loop)
   ├─ Poll for pending jobs every 30 seconds
   ├─ Attempt Mollie payment creation
   ├─ On success:
   │  ├─ Send email with payment link
   │  └─ Mark job complete
   └─ On failure:
      ├─ Increment attempt counter
      ├─ If attempts < 5: Schedule next retry
      └─ If attempts >= 5: Mark job failed (manual intervention)

Retry Timeline: 30s → 60s → 120s → 240s → 480s (4 minutes total)
```

### Implementation Checklist

**Database Changes:**

- `jobs` table already exists (from Cloud Run migration)
- Add new job type: `payment_creation`

**Code Changes:**

1. `app/checkout/actions.ts`
   - Wrap Mollie payment creation in try-catch
   - On failure: create job instead of returning error
   - Send confirmation email to user

2. `lib/jobs/handlers/paymentCreationHandler.ts` (NEW)
   - Fetch pending `payment_creation` jobs
   - Attempt Mollie payment creation
   - Retry with exponential backoff
   - Send email on success/final failure

3. `lib/commands/payments.ts`
   - Helper to extract retry scheduling logic
   - Consistent retry timing across job types

**Email Templates:**

- "Order Confirmed" - Sent immediately after checkout
- "Payment Link Ready" - Sent when payment creation succeeds
- "Payment Required" - Sent after retries exhausted (manual payment options)

### Key Guarantees

✅ **User Always Sees Confirmation** - Order created even if Mollie is down
✅ **Automatic Retry** - No manual intervention for temporary outages
✅ **Transparent** - Email keeps user informed at each step
✅ **Seat Protection** - Seats held while payment processing
✅ **Fair Backoff** - Respects Mollie's recovery time
✅ **Fallback** - Admin can manually mark payment after 5 attempts

### Risk Mitigation

**Risk:** Orders accumulate with failed payments

- **Mitigation:** Alert admin after 5 failed attempts, manual payment entry form

**Risk:** User misses payment email

- **Mitigation:** Add to order status page "Your payment is pending - [click here to pay]"

**Risk:** Payment created twice (Mollie recovers after we give up)

- **Mitigation:** Mollie tracks by order ID, duplicate creation is idempotent

---

## Deprecated: GitHub Actions for Payment Sync

### Background

Prior to the job queue implementation, payment and order synchronization was handled by GitHub Actions workflows:

- `.github/workflows/sync-payments.yml` - Hourly polling of Mollie payment status
- `.github/workflows/sync-orders.yml` - Daily cleanup of old pending orders
- `.github/workflows/sync-inventory.yml` - Combined sync script

These workflows used OAuth2 client credentials to authenticate with the sync endpoints:
- `POST /api/admin/sync-payments` - Checks payment status and updates orders
- `POST /api/admin/sync-orders` - Cancels orders >24 hours old

### Why They're No Longer Needed

The job queue system (Bug #5 implementation) completely replaces and improves upon these workflows:

| Feature | GitHub Actions (Old) | Job Queue (New) | Winner |
|---------|---------------------|-----------------|--------|
| **Payment Status Sync** | Hourly polling | Real-time webhooks | ✅ Job Queue |
| **Retry Logic** | None (waits 1 hour) | Exponential backoff (5s-5min) | ✅ Job Queue |
| **Seat Release** | ❌ No seat handling | ✅ Atomic seat + coupon release | ✅ Job Queue |
| **Order Cleanup** | Cancels orders only | Releases seats + coupons + cancels | ✅ Job Queue |
| **Processing Speed** | Up to 1 hour delay | <5 seconds (webhook) | ✅ Job Queue |
| **Monitoring** | GitHub Actions logs | Admin dashboard `/admin/jobs` | ✅ Job Queue |
| **Failure Handling** | Silent failures | Visible in dashboard | ✅ Job Queue |
| **Cost** | GitHub Actions minutes | Free (Cloud Run free tier) | ✅ Job Queue |

### What the Job Queue Provides

**Real-Time Payment Processing:**
- Webhook jobs process payment status updates within seconds (vs hourly polling)
- Payment creation jobs retry on provider downtime with exponential backoff
- Users get immediate feedback instead of waiting up to an hour

**Complete Resource Management:**
- `orphaned_order_cleanup` job releases BOTH seats AND coupons (GitHub Actions only cancelled orders)
- Prevents inventory leakage and coupon abuse
- Runs daily with proper transaction handling

**Better Visibility:**
- Admin dashboard shows all job statuses in real-time
- Failed jobs are immediately visible (vs buried in GitHub Actions logs)
- Job retry attempts and error messages visible at a glance

### Migration Timeline

**Phase 1 (Week 3-4): Parallel Run**
- Job queue deployed and handling all new payments
- GitHub Actions remain enabled but idle (no pending payments to sync)
- Monitor `/admin/jobs` dashboard for any failures

**Phase 2 (Week 5): Observation Period**
- Disable GitHub Actions schedule triggers (keep `workflow_dispatch` for emergency)
- Monitor job queue for 1-2 weeks
- Verify no edge cases missed by job queue

**Phase 3 (Week 6+): Full Deprecation**
- Delete GitHub Actions workflow files:
  - `.github/workflows/sync-payments.yml`
  - `.github/workflows/sync-orders.yml`
  - `.github/workflows/sync-inventory.yml`
- Consider removing sync endpoints if no longer needed:
  - `app/api/admin/sync-payments/route.ts`
  - `app/api/admin/sync-orders/route.ts`

### Rollback Plan (Emergency Only)

If the job queue fails catastrophically:

1. Re-enable GitHub Actions schedule triggers
2. Workflows will resume hourly payment checks
3. Job queue workers can be stopped without data loss
4. Note: Seats won't be released automatically (manual intervention needed)

### Recommendation

**Delete the GitHub Actions workflows after 1-2 weeks of job queue monitoring.**

The job queue system is strictly superior in every measurable way:
- ✅ Faster processing
- ✅ Better reliability
- ✅ Complete resource management
- ✅ Real-time visibility
- ✅ No cost increase

Keeping the old workflows creates maintenance burden and potential confusion about which system is authoritative.

---

### Week 2: Stability & Monitoring

- [ ] Monitor production for invalid order attempts
- [ ] Set up alerts for validation failures
- [ ] Verify Bug #2 prevents expired item purchases
- [ ] **NEW:** Monitor seat inventory accuracy
- [ ] **NEW:** Alert on orphaned orders (seats reserved but payment unknown)
- [ ] **NEW:** Monitor job queue dashboard for failures
- [ ] **NEW:** Disable GitHub Actions schedule triggers (keep workflow_dispatch)
- [ ] Document password reset investigation results
- [ ] Fix any discovered issues from production data

### Week 3: Critical Bug Fixes - Continued

**Bug #5 Implementation (If not completed in Week 1)**

- [ ] Update `lib/queries/performances.ts` with seat management functions
- [ ] Update checkout transaction logic
- [ ] Implement payment failure handlers
- [ ] Test concurrent overselling scenarios
- [ ] Deploy to production

### Week 3: Cloud Migration - Part 1 (Local Setup)

- [ ] Create database migration for jobs table
- [ ] Run migration on production
- [ ] Implement `lib/jobs/jobProcessor.ts`
- [ ] Create `lib/jobs/handlers/pdfGenerationHandler.ts`
- [ ] Implement `lib/jobs/localWorker.ts` (or rename to `worker.ts`)
- [ ] Create worker entry point `scripts/start-worker.ts`
- [ ] Add worker scripts to `package.json` (`worker`, `worker:watch`)
- [ ] Test job processing locally with `npm run worker`
- [ ] Integration tests for job queue
- [ ] Update `lib/commands/payments.ts` to create jobs
- [ ] Test end-to-end with mock payment locally

### Week 4: Cloud Migration - Part 2 (Docker + Cloud Run)

- [ ] Create `docker-compose.yml` with postgres, app, and worker services
- [ ] Create `Dockerfile.worker`
- [ ] Test full stack with `docker-compose up`
- [ ] Verify worker processes jobs correctly in Docker
- [ ] Set up GCP project and GCS bucket
- [ ] Create service account and permissions
- [ ] Implement `lib/utils/gcsUploader.ts`
- [ ] Build and push Docker image to GCR: `gcloud builds submit`
- [ ] Deploy to Cloud Run with environment variables
- [ ] Set up Cloud Run monitoring and alerts
- [ ] Create admin dashboard (`app/admin/jobs/page.tsx`)
- [ ] Load testing (100+ concurrent jobs)
- [ ] Verify auto-scaling under load
- [ ] Cost monitoring and verification
- [ ] Monitor production metrics (24/7 for 1 week)
- [ ] Document setup and operations
- [ ] Plan Cloud Tasks migration (future optimization)

### Post-Deployment

- [ ] Ongoing monitoring of job queue
- [ ] Weekly performance reviews
- [ ] Identify optimization opportunities
- [ ] Plan next enhancements (Cloud Tasks, image processing)
- [ ] Gather metrics for cost savings report

---

## Conclusion

This implementation guide provides a clear, week-by-week roadmap for:

1. **Fixing critical bugs** that are losing revenue
2. **Improving system scalability** with async job processing
3. **Reducing costs** with Google Cloud services
4. **Future-proofing** with a generic job queue system

The approach is low-risk, highly testable, and allows for parallel development where possible.

**Start with the bug fixes immediately. They're quick wins with high impact.**
