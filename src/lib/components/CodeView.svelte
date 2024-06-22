<script lang="ts">
  import prettierEstree from "prettier/plugins/estree";
  import prettierTypescript from "prettier/plugins/typescript";
  import { format as formatWithPrettier } from "prettier/standalone";
  import { Highlight } from "svelte-highlight";
  import typescriptHighlighting from "svelte-highlight/languages/typescript";

  import "svelte-highlight/styles/github.css";

  export let code: string;
  export let format = false;

  const id = `code-prettier-${crypto.randomUUID()}`;
</script>

<input type="checkbox" {id} bind:checked={format} />
<label for={id}>Format</label>

{#if format}
  {@const formatPromise = formatWithPrettier(code, {
    parser: "typescript",
    plugins: [prettierTypescript, prettierEstree],
  })}

  {#await formatPromise}
    <p>Formatting code</p>
  {:then formattedCode}
    <Highlight code={formattedCode} language={typescriptHighlighting} />
  {:catch error}
    <p>Error formatting code:</p>
    <pre><code>{error.message}</code></pre>
  {/await}
{:else}
  <Highlight {code} language={typescriptHighlighting} />
{/if}
