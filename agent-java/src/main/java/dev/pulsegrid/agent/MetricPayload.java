package dev.pulsegrid.agent;

import java.util.List;

record MetricPayload(
        int schemaVersion,
        String agentId,
        String name,
        String timestamp,
        SystemMetric system,
        CpuMetric cpu,
        MemoryMetric memory,
        List<DiskMetric> disks,
        NetworkMetric network,
        List<ProcessMetric> processes
) {
    record SystemMetric(
            String hostname,
            String os,
            String osVersion,
            String architecture,
            long uptimeSeconds,
            long bootTimeEpochSeconds
    ) {}

    record CpuMetric(
            double usagePercent,
            int logicalCores,
            int physicalCores,
            long frequencyHz,
            long maxFrequencyHz,
            Double temperatureCelsius,
            List<Double> loadAverage
    ) {}

    record MemoryMetric(
            long totalBytes,
            long usedBytes,
            long availableBytes,
            long swapTotalBytes,
            long swapUsedBytes
    ) {}

    record DiskMetric(
            String name,
            String mount,
            String type,
            long totalBytes,
            long usableBytes,
            long usedBytes,
            double usagePercent
    ) {}

    record NetworkInterfaceMetric(
            String name,
            String displayName,
            String macAddress,
            List<String> ipv4,
            long rxBytes,
            long txBytes
    ) {}

    record NetworkMetric(
            long rxBytes,
            long txBytes,
            double rxBytesPerSecond,
            double txBytesPerSecond,
            List<NetworkInterfaceMetric> interfaces
    ) {}

    record ProcessMetric(
            int pid,
            String name,
            double cpuPercent,
            long memoryBytes
    ) {}
}

