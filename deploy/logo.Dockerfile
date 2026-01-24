FROM nginx:alpine

# Copy custom configuration
COPY logo-nginx.conf /etc/nginx/nginx.conf

# Create the data directory
RUN mkdir -p /data/logos

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
