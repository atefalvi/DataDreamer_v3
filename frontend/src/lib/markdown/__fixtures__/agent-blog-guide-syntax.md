# Markdown Pipeline Contract

Opening paragraph with **strong text**, _emphasis_, `inline_code`, and a [reference link](https://example.com/docs).

## Heading With Anchors

### Nested Heading Preserves Case

:::tip Data Format
Use **gradient checkpointing** to cut VRAM usage.

- Keep `instruction` and `response` keys.
- Validate rows before upload.

See [training notes](https://example.com/training).

:::details Nested Evidence
Nested details inside a callout should render.
:::
:::

:::warning Hardware Alert
Training requires at least 24 GB VRAM.
:::

:::info Reference
Full implementation is available at github.com/example/repo.
:::

:::note Side Note
This was tested on PyTorch 2.3 with CUDA 12.1.
:::

:::caution{title="Dangerous Operation"}
Dropping a collection is irreversible without a backup.
:::

:::important Must Read
Run the golden tests before merging.
:::

:::example Worked Example
Use a small fixture before rendering a live post.
:::

:::technical Pipeline Detail
The custom block children stay as mdast until rehype conversion.
:::

:::details Raw Training Log
Step 0/500 | loss: **2.4831**

```txt
loss=2.4831
lr=1e-4
```
:::

:::quote
THE DATA IS THE MODEL. GARBAGE IN, GARBAGE OUT.
:::

## Media And Tables

![Training loss curve](https://api.data-dreamer.net/assets/f53cd922-44a4-403c-b56e-7f98af3578b3.png "Loss curve after epoch three")

:::imagegrid
![Caption one](https://api.data-dreamer.net/assets/135423d8-e08d-46cd-b1ce-2189d53efa46.png)
![Caption two](https://api.data-dreamer.net/assets/14d306d4-3af4-4e46-b73b-3d82009eaa9b.png)
![Caption three](https://api.data-dreamer.net/assets/8d024edb-4d0a-4ea9-ae1a-fd12a73fa92d.png)
:::

| Model | Params | VRAM | Throughput |
|---|---:|---:|---:|
| Mistral 7B | 7B | 16 GB | 42 tok/s |
| Llama 3 8B | 8B | 18 GB | 38 tok/s |

```python
from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained("mistralai/Mistral-7B-v0.1")
```

:::mystery Unsupported Block
This should remain literal for forward compatibility.
:::

:::note Outer Note
:::warning Inner Callout
Nested callouts should remain literal.
:::
:::
