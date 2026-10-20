package com.northstar.crm.messaging;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

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
        // Malformed JSON throws JacksonException → straight to the DLT
        JsonNode node = jsonMapper.readTree(json);

        JsonNode version = node.get("eventVersion");
        if (version == null || !CustomerInteractionRecordedV1.VERSION.equals(version.asString())) {
            throw new UnsupportedEventVersionException(version == null ? "missing" : version.asString());
        }

        processor.process(jsonMapper.treeToValue(node, CustomerInteractionRecordedV1.class));
    }
}