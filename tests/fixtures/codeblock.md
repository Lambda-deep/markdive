# Section 1: Basic Code Block

Here's a simple code block with a heading-like line inside:

```
# This is NOT a heading
## This is also NOT a heading
### Still not a heading
```

This text should be part of Section 1.

# Section 2: Code Block with Language

Code blocks with language specifications should also be ignored:

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

Content after the code block.

# Section 3: TypeScript Example

```typescript
// Function to parse markdown
function parseMarkdown(content: string) {
  // # This comment looks like a heading but isn't
  const lines = content.split('\n');
  return lines;
}
```

More content in Section 3.

# Section 4: Multiple Code Blocks

First code block:

```python
# Python comment that looks like heading
def main():
    pass
```

Text between code blocks.

```javascript
// # JavaScript comment
const heading = "# Not a heading";
```

Final content in Section 4.
