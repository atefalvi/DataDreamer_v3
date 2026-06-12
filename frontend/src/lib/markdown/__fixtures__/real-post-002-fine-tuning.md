# Fine-Tuning Mistral 7B on a Custom Instruction Dataset

After two weeks of wrangling data pipelines and OOM errors, I finally have a stable
fine-tuning setup for Mistral 7B on my RTX 3090.

## Dataset Preparation

I used 4,200 instruction-response pairs formatted in JSONL.

:::tip Data Format
Ensure every sample has `instruction` and `response` keys. The training script
rejects anything else.
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

:::quote
THE DATA IS THE MODEL. GARBAGE IN, GARBAGE OUT — ALWAYS.
:::
