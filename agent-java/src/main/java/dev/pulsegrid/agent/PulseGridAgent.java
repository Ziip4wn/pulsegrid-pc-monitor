package dev.pulsegrid.agent;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicBoolean;

public final class PulseGridAgent {
    private static final String VERSION = "1.0.0";

    private PulseGridAgent() {}

    public static void main(String[] args) {
        AgentConfig config = AgentConfig.fromEnvironment();
        MetricCollector collector = new MetricCollector(config);
        Gson gson = new GsonBuilder().disableHtmlEscaping().serializeNulls().create();
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                // Socket.IO partage le même port et réserve les upgrades aux WebSockets.
                // Forcer HTTP/1.1 évite qu'un JDK récent propose un upgrade h2c pour l'ingestion.
                .version(HttpClient.Version.HTTP_1_1)
                .build();
        AtomicBoolean running = new AtomicBoolean(true);
        Runtime.getRuntime().addShutdownHook(new Thread(() -> running.set(false)));

        System.out.printf("PulseGrid Agent v%s%n", VERSION);
        System.out.printf("Machine : %s (%s)%n", config.agentName(), config.agentId());
        System.out.printf("Serveur : %s%n", config.serverUrl());
        System.out.printf("Intervalle : %d ms%n", config.sampleIntervalMs());

        boolean announcedConnection = false;
        while (running.get()) {
            long startedAt = System.nanoTime();
            try {
                MetricPayload payload = collector.collect();
                HttpRequest.Builder request = HttpRequest.newBuilder()
                        .uri(URI.create(config.serverUrl() + "/api/v1/metrics"))
                        .timeout(Duration.ofSeconds(8))
                        .header("Content-Type", "application/json")
                        .header("User-Agent", "PulseGrid-Agent/" + VERSION)
                        .POST(HttpRequest.BodyPublishers.ofString(gson.toJson(payload)));
                if (!config.token().isBlank()) {
                    request.header("Authorization", "Bearer " + config.token());
                }
                HttpResponse<String> response = client.send(request.build(), HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    if (!announcedConnection) {
                        System.out.println("Connecté — les mesures sont transmises au dashboard.");
                        announcedConnection = true;
                    }
                } else {
                    announcedConnection = false;
                    System.err.printf("Le serveur a refusé la mesure (HTTP %d) : %s%n", response.statusCode(), response.body());
                }
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception exception) {
                announcedConnection = false;
                System.err.printf("En attente du serveur : %s%n", exception.getMessage());
            }

            long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000;
            long sleepMs = Math.max(50, config.sampleIntervalMs() - elapsedMs);
            try {
                Thread.sleep(sleepMs);
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        System.out.println("Agent arrêté.");
    }
}

