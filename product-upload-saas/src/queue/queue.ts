import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export const redisConnection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export interface UploadJobData {
  jobId: string;
  customerId: string;
  sheetId: string;
}

export const uploadQueue = new Queue<UploadJobData>('product-upload', {
  connection: redisConnection,
});
