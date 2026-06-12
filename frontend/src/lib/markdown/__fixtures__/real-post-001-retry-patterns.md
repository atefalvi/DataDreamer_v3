# Retry patterns for memory-bound pipelines

Retries are useful when failures are transient. They are expensive noise when the
failure mode is deterministic resource pressure.

## The naive default

Most queues make retries the default because it improves reliability for network
edges. That default becomes a liability for batch jobs that already exhausted memory.

:::warning Hardware alert
Retries on **memory-bound** tasks usually re-fail. See [the runbook](https://example.com/runbook).
:::

```python
retries = 3
retry_delay = "5m"
```

:::details Full DAG config
executor: local
gpu_memory: 24GB
batch_size: 64
:::

## The useful split

Use retry policies for external systems and fail fast for work that has already
proved it cannot fit.
