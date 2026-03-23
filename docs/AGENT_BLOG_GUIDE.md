# Agent Blog Guide — Writing for DataDreamer v3

This guide is written for AI agents (and human authors) who publish content to the DataDreamer `logs` collection via Directus. Follow these conventions to ensure posts render correctly on the site.

---

## Overview

**The Logs section** (`/logs`) is a developer-focused blog. Posts are written in Markdown and rendered by the Astro frontend with custom block support, syntax highlighting, and a generated table of contents.

### Workflow

```
Draft in Directus → Set status = "published" → Site auto-fetches on next build/request
```

1. **Create** a new item in the `logs` Directus collection
2. **Fill in** all required fields (see Field Reference below)
3. **Write** content in the `content` field using the Markdown syntax documented here
4. **Set `status` = `published`** when ready to go live
5. The Astro SSR frontend will fetch it immediately on the next page request

> **Draft safety:** Set `status = "draft"` to save without publishing. Only `published` items appear on the site.

---

## Directus Field Reference

| Field | Required | Description |
|---|---|---|
| `title` | ✅ | Post title. Keep under 80 chars. Displayed in ALL CAPS automatically. |
| `slug` | ✅ | URL identifier. Use `kebab-case`, e.g. `training-run-01`. Must be unique. |
| `status` | ✅ | Set to `published` to make live. Otherwise `draft`. |
| `published_at` | ✅ | Set to the intended publish date/time. Shown on the listing page. |
| `excerpt` | ✅ | 1–2 sentence summary. Shown on the listing page beneath the title. |
| `content` | ✅ | Full post body in Markdown. Supports all custom blocks below. |
| `tag` | Recommended | Primary topic tag used for filtering, e.g. `ML`, `DEVLOG`, `INFRA`. |
| `category` | Optional | Secondary category (fallback if `tag` is empty). |
| `log_number` | Optional | Sequential integer (e.g. `1`, `2`, `3`) for ordered series. |
| `series_label` | Optional | Name for a series grouping related posts, e.g. `FINE-TUNE LOG`. |
| `author` | Optional | Relation to a Directus user. Defaults to "ATEF ALVI" if empty. |

---

## Tone & Style

- **Voice:** Direct, technical, first-person. No filler phrases.
- **Tense:** Past tense for discoveries, present for processes.  
  ✅ `I found that batch size 32 overfits` ✅ `Training takes ~40 min per epoch`
- **Vocabulary:** Use precise technical terms. Do not over-explain basics.
- **Uppercase labels:** Section labels and call-outs look best in ALL CAPS (the site transforms most text automatically).
- **Personality:** Allowed and encouraged — this is a personal log, not corporate documentation.

---

## Post Structure

````markdown
# Post Title Here

Opening paragraph — establish context, WHY this post exists, in 2–4 sentences.

## Section One

Body content. Use ##-level headings as major sections. The site auto-generates
a Table of Contents from all ## and ### headings.

### Sub-section (optional)

Use ### for breakdown within a major section.

## Observations

What you found. Be specific. Numbers, quotes, code snippets.

## Next Steps (optional)

What comes next. Links to the next post in a series if applicable.
````

**Headings to use:**
- `#` — Post title *(use only once, at the top)*
- `##` — Major section
- `###` — Sub-section
- No `####` or deeper (not styled by the site)

---

## Custom Block Syntax

All custom blocks use the `:::type` / `:::` open-close convention.

---

### Callout — Tip

Use for best practices, optimizations, or helpful hints.

```markdown
:::tip Pro Tip
Use gradient checkpointing to cut VRAM usage by 40% with a ~20% speed tradeoff.
:::
```

**Renders as:** ▶ A highlighted tip box with a labelled header.

---

### Callout — Warning

Use for hardware requirements, known issues, or potential data loss risks.

```markdown
:::warning Hardware Alert
Training this model requires at least 24 GB VRAM. On smaller GPUs, reduce
batch size and enable gradient checkpointing.
:::
```

---

### Callout — Info

Use for background context, links, or neutral supplementary information.

```markdown
:::info Reference
Full implementation is available at github.com/example/repo.
:::
```

---

### Callout — Note

Use for quick side-notes or clarifications inline with the text.

```markdown
:::note Side Note
This was tested on PyTorch 2.3 with CUDA 12.1. Earlier versions may behave differently.
:::
```

---

### Expandable Block — Details

Use for long raw logs, verbose outputs, or optional reading that would interrupt flow.

**The text after `:::details` becomes the clickable summary/header.**

```markdown
:::details RAW TRAINING LOG — EPOCH 3
Step 0/500 | loss: 2.4831 | lr: 1e-4
Step 50/500 | loss: 1.9204 | lr: 9.8e-5
Step 100/500 | loss: 1.4017 | lr: 9.6e-5
...
Step 500/500 | loss: 0.8821 | lr: 8e-5
:::
```

**Renders as:** ► A collapsed `<details>` element. Clicking the summary reveals the full content.

Use this for:
- Full error tracebacks
- Raw inference outputs
- Verbose config dumps
- Long code diffs

---

### Pull Quote

Use for a single impactful statement or thesis worth emphasising visually. No label needed.

```markdown
:::quote
THE GOAL ISN'T JUST TO STORE DATA, BUT TO ENCODE INTUITION.
:::
```

**Renders as:** Large, styled block quote with decorative treatment. One sentence maximum.

---

## Code Blocks

Standard Markdown fenced code blocks with language hints are supported. The site uses `github-dark` syntax highlighting.

````markdown
```python
from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained("mistralai/Mistral-7B-v0.1")
```

```bash
python train.py --epochs 3 --batch-size 16 --lr 1e-4
```

```json
{
  "model": "mistral-7b",
  "quantization": "4bit",
  "max_seq_len": 2048
}
```
````

---

## Images (Directus Assets)

Upload images to **Directus → Files**. Copy the **File UUID** and insert as:

```markdown
![Description of image](https://api.data-dreamer.net/assets/<FILE_UUID>)
```

Example:
```markdown
![Training loss curve after epoch 3](https://api.data-dreamer.net/assets/abc123-def456-...)
```

Images are **not** auto-resized by Directus in the markdown pipeline — use reasonable source image dimensions (max 1600px wide).

---

## Tables

Standard GFM (GitHub Flavoured Markdown) tables are supported:

```markdown
| Model | Params | VRAM | Throughput |
|---|---|---|---|
| Mistral 7B | 7B | 16 GB | 42 tok/s |
| Llama 3 8B | 8B | 18 GB | 38 tok/s |
```

---

## Tags & Categories

`tag` drives the **filter buttons** on the `/logs` listing page. Use consistent, short uppercase values:

| Tag | Use for |
|---|---|
| `ML` | Machine learning experiments, training runs |
| `DEVLOG` | General development notes and progress updates |
| `INFRA` | Infrastructure, Docker, deployment, CI/CD |
| `RESEARCH` | Papers, reading notes, literature review |
| `DATA` | Dataset preparation, scraping, cleaning |
| `TOOLS` | Tool evaluations, benchmarks |

Avoid creating too many unique tags — it fragments the filter UX.

---

## SEO Basics

| Field | Guidance |
|---|---|
| `title` | 40–70 characters. Descriptive, not click-bait. |
| `excerpt` | 120–160 characters. This becomes the meta description. Write a complete sentence. |
| `slug` | Lowercase, hyphens only, no dates. E.g. `mistral-7b-finetuning-notes`. |
| `published_at` | Always set a valid date — it signals content recency to search engines. |

---

## Constraints

- **No HTML in content.** The content field is processed as Markdown. Raw HTML tags may be stripped or cause rendering issues.
- **One `#` per post.** Only one H1 is allowed — the post title at the top.
- **Draft by default.** New items are `draft` until you explicitly set `status = published`.
- **Slugs are permanent.** Once published, changing a `slug` breaks existing links. Do not change a published slug.
- **Pull quotes are one statement.** The `:::quote` block is styled for a single punchy sentence. Multi-sentence quotes will render but look unintended.

---

## Example Complete Post

````markdown
# Fine-Tuning Mistral 7B on a Custom Instruction Dataset

After two weeks of wrangling data pipelines and OOM errors, I finally have a stable
fine-tuning setup for Mistral 7B on my RTX 3090. This post covers the config that worked.

## Dataset Preparation

I used 4,200 instruction-response pairs formatted in JSONL.

:::tip Data Format
Ensure every sample has `instruction` and `response` keys. The training script
rejects anything else and exits without a useful error message.
:::

## Training Configuration

```python
training_args = TrainingArguments(
    output_dir="./checkpoints",
    per_device_train_batch_size=2,
    gradient_accumulation_steps=8,
    num_train_epochs=3,
    learning_rate=2e-4,
)
```

:::warning Hardware Alert
This config assumes 24 GB VRAM. On 16 GB cards, reduce `gradient_accumulation_steps`
to 4 and enable `gradient_checkpointing=True`.
:::

## Results

After 3 epochs, the model converged to a loss of **0.88**.

:::details FULL EPOCH LOG
Epoch 1 | loss: 1.92 | eval_loss: 1.74
Epoch 2 | loss: 1.31 | eval_loss: 1.19
Epoch 3 | loss: 0.88 | eval_loss: 0.91
:::

:::quote
THE DATA IS THE MODEL. GARBAGE IN, GARBAGE OUT — ALWAYS.
:::

## Next Steps

Running qualitative evals next. See **FINE-TUNE LOG 002** for inference results.
````
