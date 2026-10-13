import { z } from "zod";

const nonNegative = z.number().finite().nonnegative();
const percentage = z.number().finite().min(0).max(100);

const processSchema = z.object({
  pid: z.number().int().nonnegative(),
  name: z.string().min(1).max(300),
  cpuPercent: percentage,
  memoryBytes: nonNegative,
}).strip();

const diskSchema = z.object({
  name: z.string().max(300),
  mount: z.string().max(1000),
  type: z.string().max(100),
  totalBytes: nonNegative,
  usableBytes: nonNegative,
  usedBytes: nonNegative,
  usagePercent: percentage,
}).strip();

const interfaceSchema = z.object({
  name: z.string().max(300),
  displayName: z.string().max(300),
  macAddress: z.string().max(100).optional().default(""),
  ipv4: z.array(z.string().max(100)).max(32),
  rxBytes: nonNegative,
  txBytes: nonNegative,
}).strip();

export const metricSchema = z.object({
  schemaVersion: z.literal(1),
  agentId: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  timestamp: z.string().datetime({ offset: true }),
  system: z.object({
    hostname: z.string().min(1).max(300),
    os: z.string().min(1).max(300),
    osVersion: z.string().max(300),
    architecture: z.string().max(100),
    uptimeSeconds: nonNegative,
    bootTimeEpochSeconds: nonNegative,
  }).strip(),
  cpu: z.object({
    usagePercent: percentage,
    logicalCores: z.number().int().positive(),
    physicalCores: z.number().int().positive(),
    frequencyHz: nonNegative,
    maxFrequencyHz: nonNegative,
    temperatureCelsius: z.number().finite().nullable(),
    loadAverage: z.array(z.number().finite()).length(3),
  }).strip(),
  memory: z.object({
    totalBytes: nonNegative,
    usedBytes: nonNegative,
    availableBytes: nonNegative,
    swapTotalBytes: nonNegative,
    swapUsedBytes: nonNegative,
  }).strip(),
  disks: z.array(diskSchema).max(128),
  network: z.object({
    rxBytes: nonNegative,
    txBytes: nonNegative,
    rxBytesPerSecond: nonNegative,
    txBytesPerSecond: nonNegative,
    interfaces: z.array(interfaceSchema).max(128),
  }).strip(),
  processes: z.array(processSchema).max(100),
}).strip();

