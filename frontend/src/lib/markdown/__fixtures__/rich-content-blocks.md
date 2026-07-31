:::checklist Launch checklist
[x] Confirm the source system.
[ ] Test the empty state.
! Validate permissions before production.
? What happens if the API fails?
* Document the authoring pattern.
- Keep the fallback simple.
Keep this unmarked item neutral.
:::

:::embed Product walkthrough
<iframe width="560" height="315" src="https://media.example.com/embed/product-walkthrough" title="Product walkthrough"></iframe>
:::

:::embed Unsupported
source: https://example.com/talk
:::

:::embed Interactive operations dashboard
url: https://charts.example.com/embed/operations
height: 720
source: https://charts.example.com/reports/operations
:::

:::metric
label: Build time reduced
value: 38%
caption: After removing duplicate transforms.
symbol: down
tone: green
:::

:::metrics Pipeline snapshot
label: Build time
value: 38%
symbol: down
tone: green

---

label: Error rate
value: 2.1%
symbol: up
tone: red

---

label: Review status
value: Stable
symbol: neutral
tone: yellow
:::

Quote callout authoring:

```md
:::quote
Simple systems are easier to trust.
:::
```

:::quote
Simple systems are easier to trust.
:::

:::formula Renewal rate
value: \text{Renewal Rate} = \frac{\text{Renewed Accounts}}{\text{Eligible Accounts}} \times 100
caption: Keep the denominator consistent.
:::

Inline math $E = mc^2$ works.

$$
\frac{a}{b}
$$

:::detail Why this matters
This should behave the same as :::details.
:::

:::details Implementation notes
Normal text inside.

:::text Example
Nested text panel.
:::

:::warning Production caution
Check permissions first.
:::
:::

:::divider
:::

:::divider Next phase
:::

:::divider
---
:::

:::divider
***
:::

:::divider
-x-
:::

:::divider
label: Phase two
pattern: -x-
tone: accent
:::

:::imagegrid Product screenshots
![Dashboard state](https://api.data-dreamer.net/assets/135423d8-e08d-46cd-b1ce-2189d53efa46.png "Main dashboard view")
![Content model](https://api.data-dreamer.net/assets/14d306d4-3af4-4e46-b73b-3d82009eaa9b.png)
:::

:::imagegrid Detail screenshots
![Chart detail](https://api.data-dreamer.net/assets/8d024edb-4d0a-4ea9-ae1a-fd12a73fa92d.png)
![Run state](https://api.data-dreamer.net/assets/135423d8-e08d-46cd-b1ce-2189d53efa46.png)
![Review state](https://api.data-dreamer.net/assets/14d306d4-3af4-4e46-b73b-3d82009eaa9b.png)
:::

Standard quote authoring:

```md
> Main quoted idea
```

> Main quoted idea

Continuous nested quote authoring:

```md
> Main quoted idea
>> Nested subpoint
>> Another nested subpoint
>
> Return to main quote
```

> Main quoted idea
>> Nested subpoint
>> Another nested subpoint
>
> Return to main quote

Interrupted quote authoring:

```md
> Main quoted idea
>> Nested subpoint

some text here

>> Another nested subpoint
>
> Return to main quote
```

> Main quoted idea
>> Nested subpoint

some text here

>> Another nested subpoint
>
> Return to main quote
