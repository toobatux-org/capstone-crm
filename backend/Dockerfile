# crm-api — Spring Boot (Java 21)
# Stage 1: build the JAR
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
# Tests run in CI. This image only compiles so an unfinished service still builds.
RUN mvn -B -q package -DskipTests \
    && find target -maxdepth 1 -type f -name '*.jar' ! -name '*.original' -exec cp {} /src/app.jar \;

# Stage 2: small runtime image
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /src/app.jar app.jar
# OpenShift runs containers as a random non-root user in group 0
RUN chgrp 0 app.jar && chmod g=u app.jar
USER 1001
EXPOSE 8080
# No secrets here. Database URL, user, and password come from the environment.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
