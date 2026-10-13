package dev.pulsegrid.agent;

import java.net.InetAddress;
import java.util.Locale;

record AgentConfig(
        String serverUrl,
        String token,
        String agentId,
        String agentName,
        long sampleIntervalMs,
        int topProcesses
) {
    static AgentConfig fromEnvironment() {
        String hostname = findHostname();
        String defaultId = hostname.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9._-]", "-");
        return new AgentConfig(
                cleanUrl(env("PULSEGRID_SERVER_URL", "http://localhost:4000")),
                env("MONITOR_TOKEN", ""),
                env("AGENT_ID", defaultId),
                env("AGENT_NAME", hostname),
                boundedLong(env("SAMPLE_INTERVAL_MS", "2000"), 500, 60_000, 2_000),
                (int) boundedLong(env("TOP_PROCESSES", "10"), 1, 50, 10)
        );
    }

    private static String env(String name, String fallback) {
        String value = System.getenv(name);
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private static String cleanUrl(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private static long boundedLong(String value, long min, long max, long fallback) {
        try {
            return Math.max(min, Math.min(max, Long.parseLong(value)));
        } catch (NumberFormatException ignored) {
            return fallback;
        }
    }

    private static String findHostname() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (Exception ignored) {
            return "ordinateur-local";
        }
    }
}

