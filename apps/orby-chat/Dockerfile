# Orby API — single container: widget + sprites + chat API. Non-root, slim.
FROM python:3.12-slim
WORKDIR /app
COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY api/orby ./orby
COPY public ./public
RUN useradd --system --uid 10001 orby
USER orby
EXPOSE 8100
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD python -c "import urllib.request;urllib.request.urlopen('http://127.0.0.1:8100/health/live')"
CMD ["uvicorn", "orby.main:app", "--host", "0.0.0.0", "--port", "8100"]
