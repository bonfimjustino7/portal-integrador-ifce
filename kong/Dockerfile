FROM kong:3.7

USER root

COPY kong.template.yml /kong/templates/kong.template.yml
COPY render-kong-config.lua /kong/render-kong-config.lua
COPY bootstrap.sh /kong/bootstrap.sh

RUN chmod +x /kong/bootstrap.sh && mkdir -p /kong/generated && chown -R kong:0 /kong/generated

USER kong

ENTRYPOINT ["/kong/bootstrap.sh"]
CMD ["kong", "docker-start"]
