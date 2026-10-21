package com.northstar.crm.messaging;

import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Slf4j
@Component
public class InteractionEventConsumer {

    private final JsonMapper jsonMapper;
    private final InteractionEventProcessor processor;

    public InteractionEventConsumer(JsonMapper jsonMapper, InteractionEventProcessor processor) {
        this.jsonMapper = jsonMapper;
        this.processor = processor;
    }

    @KafkaListener(topics = InteractionEventPublisher.TOPIC)
    public void onMessage(String json) {
        log.info("Received raw interaction event message from topic: [{}]", InteractionEventPublisher.TOPIC);

        // Malformed JSON throws JacksonException → straight to the DLT
        JsonNode node = jsonMapper.readTree(json);

        JsonNode version = node.get("eventVersion");
        String versionStr = version == null ? null : version.asString();

        if (version == null || !CustomerInteractionRecordedV1.VERSION.equals(version.asString())) {
            log.error("Unsupported or missing event version encountered: [{}]. Expected: [{}]",
                    versionStr, CustomerInteractionRecordedV1.VERSION);
            throw new UnsupportedEventVersionException(version == null ? "missing" : version.asString());
        }

        try {
            var event = jsonMapper .treeToValue(node, CustomerInteractionRecordedV1.class);
            log.info("Successfully mapped JSON to event type. Processing event...");

            processor.process(event);

            log.info("Successfully processed interaction event version [{}]", versionStr);
        } catch (Exception e) {
            log.error("Unexpected error while processing interaction event payload: {}", e.getMessage(), e);
            throw e;
        }
    }
}