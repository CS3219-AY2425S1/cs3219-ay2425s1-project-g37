FROM nginx:latest

ARG VITE_SELF_HOST
ENV VITE_SELF_HOST=$VITE_SELF_HOST

COPY nginx.local.conf /etc/nginx/nginx.local.conf
COPY nginx.prod.conf /etc/nginx/nginx.prod.conf
COPY set-up.sh /set-up.sh

RUN chmod +x /set-up.sh
RUN /set-up.sh
