package dev.pulsegrid.agent;

import oshi.SystemInfo;
import oshi.hardware.CentralProcessor;
import oshi.hardware.GlobalMemory;
import oshi.hardware.HardwareAbstractionLayer;
import oshi.hardware.NetworkIF;
import oshi.hardware.Sensors;
import oshi.hardware.VirtualMemory;
import oshi.software.os.FileSystem;
import oshi.software.os.OSFileStore;
import oshi.software.os.OSProcess;
import oshi.software.os.OperatingSystem;

import java.net.InetAddress;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

final class MetricCollector {
    private final AgentConfig config;
    private final HardwareAbstractionLayer hardware;
    private final OperatingSystem operatingSystem;
    private final CentralProcessor processor;
    private final GlobalMemory memory;
    private final Sensors sensors;
    private final FileSystem fileSystem;
    private long[] previousCpuTicks;
    private long previousRxBytes;
    private long previousTxBytes;
    private long previousNetworkNanos;

    MetricCollector(AgentConfig config) {
        this.config = config;
        SystemInfo systemInfo = new SystemInfo();
        this.hardware = systemInfo.getHardware();
        this.operatingSystem = systemInfo.getOperatingSystem();
        this.processor = hardware.getProcessor();
        this.memory = hardware.getMemory();
        this.sensors = hardware.getSensors();
        this.fileSystem = operatingSystem.getFileSystem();
        this.previousCpuTicks = processor.getSystemCpuLoadTicks();
        this.previousNetworkNanos = System.nanoTime();
        long[] totals = networkTotals();
        this.previousRxBytes = totals[0];
        this.previousTxBytes = totals[1];
    }

    MetricPayload collect() {
        MetricPayload.SystemMetric systemMetric = collectSystem();
        MetricPayload.CpuMetric cpuMetric = collectCpu();
        MetricPayload.MemoryMetric memoryMetric = collectMemory();
        List<MetricPayload.DiskMetric> disks = collectDisks();
        MetricPayload.NetworkMetric networkMetric = collectNetwork();
        List<MetricPayload.ProcessMetric> processes = collectProcesses();

        return new MetricPayload(
                1,
                config.agentId(),
                config.agentName(),
                Instant.now().toString(),
                systemMetric,
                cpuMetric,
                memoryMetric,
                disks,
                networkMetric,
                processes
        );
    }

    private MetricPayload.SystemMetric collectSystem() {
        String hostname;
        try {
            hostname = InetAddress.getLocalHost().getHostName();
        } catch (Exception ignored) {
            hostname = config.agentName();
        }
        return new MetricPayload.SystemMetric(
                hostname,
                operatingSystem.getFamily(),
                operatingSystem.getVersionInfo().getVersion(),
                System.getProperty("os.arch", "unknown"),
                Math.max(0, operatingSystem.getSystemUptime()),
                Math.max(0, operatingSystem.getSystemBootTime())
        );
    }

    private MetricPayload.CpuMetric collectCpu() {
        double usage = processor.getSystemCpuLoadBetweenTicks(previousCpuTicks) * 100d;
        previousCpuTicks = processor.getSystemCpuLoadTicks();
        long[] frequencies = processor.getCurrentFreq();
        long frequency = Math.round(Arrays.stream(frequencies).filter(value -> value > 0).average().orElse(0));
        double temperature = sensors.getCpuTemperature();
        Double validTemperature = Double.isFinite(temperature) && temperature > 0 ? round(temperature) : null;
        double[] rawLoad = processor.getSystemLoadAverage(3);
        List<Double> loadAverage = Arrays.stream(rawLoad)
                .map(value -> value < 0 || !Double.isFinite(value) ? 0 : value)
                .map(MetricCollector::round)
                .boxed()
                .toList();

        return new MetricPayload.CpuMetric(
                percentage(usage),
                Math.max(1, processor.getLogicalProcessorCount()),
                Math.max(1, processor.getPhysicalProcessorCount()),
                Math.max(0, frequency),
                Math.max(0, processor.getMaxFreq()),
                validTemperature,
                loadAverage
        );
    }

    private MetricPayload.MemoryMetric collectMemory() {
        long total = Math.max(0, memory.getTotal());
        long available = Math.max(0, memory.getAvailable());
        VirtualMemory virtualMemory = memory.getVirtualMemory();
        return new MetricPayload.MemoryMetric(
                total,
                Math.max(0, total - available),
                available,
                Math.max(0, virtualMemory.getSwapTotal()),
                Math.max(0, virtualMemory.getSwapUsed())
        );
    }

    private List<MetricPayload.DiskMetric> collectDisks() {
        return fileSystem.getFileStores().stream()
                .filter(store -> store.getTotalSpace() > 0)
                .map(this::toDiskMetric)
                .sorted(Comparator.comparing(MetricPayload.DiskMetric::mount))
                .toList();
    }

    private MetricPayload.DiskMetric toDiskMetric(OSFileStore store) {
        long total = Math.max(0, store.getTotalSpace());
        long usable = Math.max(0, store.getUsableSpace());
        long used = Math.max(0, total - usable);
        return new MetricPayload.DiskMetric(
                valueOr(store.getName(), "Volume"),
                valueOr(store.getMount(), "/"),
                valueOr(store.getType(), "unknown"),
                total,
                usable,
                used,
                total == 0 ? 0 : percentage(used * 100d / total)
        );
    }

    private MetricPayload.NetworkMetric collectNetwork() {
        List<MetricPayload.NetworkInterfaceMetric> interfaces = new ArrayList<>();
        long rx = 0;
        long tx = 0;
        for (NetworkIF network : hardware.getNetworkIFs()) {
            network.updateAttributes();
            long interfaceRx = Math.max(0, network.getBytesRecv());
            long interfaceTx = Math.max(0, network.getBytesSent());
            rx += interfaceRx;
            tx += interfaceTx;
            interfaces.add(new MetricPayload.NetworkInterfaceMetric(
                    valueOr(network.getName(), "network"),
                    valueOr(network.getDisplayName(), network.getName()),
                    valueOr(network.getMacaddr(), ""),
                    List.of(network.getIPv4addr()),
                    interfaceRx,
                    interfaceTx
            ));
        }

        long now = System.nanoTime();
        double elapsedSeconds = Math.max((now - previousNetworkNanos) / 1_000_000_000d, 0.001d);
        double rxRate = Math.max(0, rx - previousRxBytes) / elapsedSeconds;
        double txRate = Math.max(0, tx - previousTxBytes) / elapsedSeconds;
        previousRxBytes = rx;
        previousTxBytes = tx;
        previousNetworkNanos = now;

        return new MetricPayload.NetworkMetric(
                Math.max(0, rx),
                Math.max(0, tx),
                round(rxRate),
                round(txRate),
                interfaces
        );
    }

    private long[] networkTotals() {
        long rx = 0;
        long tx = 0;
        for (NetworkIF network : hardware.getNetworkIFs()) {
            network.updateAttributes();
            rx += Math.max(0, network.getBytesRecv());
            tx += Math.max(0, network.getBytesSent());
        }
        return new long[]{rx, tx};
    }

    private List<MetricPayload.ProcessMetric> collectProcesses() {
        return operatingSystem.getProcesses().stream()
                .sorted(Comparator.comparingDouble(OSProcess::getProcessCpuLoadCumulative).reversed())
                .limit(config.topProcesses())
                .map(process -> new MetricPayload.ProcessMetric(
                        process.getProcessID(),
                        valueOr(process.getName(), "Processus"),
                        percentage(process.getProcessCpuLoadCumulative() * 100d),
                        Math.max(0, process.getResidentSetSize())
                ))
                .toList();
    }

    private static double percentage(double value) {
        if (!Double.isFinite(value)) return 0;
        return round(Math.max(0, Math.min(100, value)));
    }

    private static double round(double value) {
        return Math.round(value * 100d) / 100d;
    }

    private static String valueOr(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}

