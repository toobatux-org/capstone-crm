package com.northstar.crm.messaging;

import java.util.Map;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.serialization.StringSerializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;
import tools.jackson.core.JacksonException;

@Configuration
public class KafkaConfig {

    public static final String DLT = InteractionEventPublisher.TOPIC + ".DLT";

    private static final Logger log = LoggerFactory.getLogger(KafkaConfig.class);

    @Bean
    NewTopic interactionsTopic() {
        return TopicBuilder.name(InteractionEventPublisher.TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    NewTopic interactionsDlt() {
        return TopicBuilder.name(DLT).partitions(1).replicas(1).build();
    }

    /** Retry a failed event 2 more times, 1 second apart, then send it to the DLT. */
    @Bean
    DefaultErrorHandler kafkaErrorHandler(@Value("${spring.kafka.bootstrap-servers}") String bootstrapServers) {
        // Separate String template: the main template writes JSON objects, but the DLT gets the raw message text
        KafkaTemplate<String, String> dltTemplate = new KafkaTemplate<>(new DefaultKafkaProducerFactory<>(
                Map.<String, Object>of(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers),
                new StringSerializer(), new StringSerializer()));

        DeadLetterPublishingRecoverer toDlt = new DeadLetterPublishingRecoverer(dltTemplate, (record, ex) -> {
            // Risk R5: never send to the DLT silently
            log.error("Sending message at {}-{}@{} to {}: {}",
                    record.topic(), record.partition(), record.offset(), DLT, ex.getMessage());
            return new TopicPartition(DLT, -1);
        });

        DefaultErrorHandler handler = new DefaultErrorHandler(toDlt, new FixedBackOff(1000L, 2L));
        // Retrying won't fix these, so they go to the DLT immediately
        handler.addNotRetryableExceptions(UnsupportedEventVersionException.class, JacksonException.class);
        return handler;
    }
}