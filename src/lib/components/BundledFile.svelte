<script lang="ts">
  import type { BundledFile } from "$lib";

  import { fileTypeFromBuffer } from "@sgtpooki/file-type";
  import { Highlight } from "svelte-highlight";
  import typescript from "svelte-highlight/languages/typescript";

  import "svelte-highlight/styles/github.css";

  export let bundledFile: BundledFile;
  $: fileTypePromise = fileTypeFromBuffer(bundledFile.contents).then((fileType) => {
    console.debug(fileType);

    if (fileType?.mime.startsWith("image/")) {
      imageSrc = URL.createObjectURL(new Blob([bundledFile.contents], { type: fileType.mime }));
    }

    return fileType;
  });

  let imageSrc: string | null = null;

  const decoder = new TextDecoder();
</script>

<h2>{bundledFile.path}</h2>
{#await fileTypePromise}
  <p>Determining file type</p>
{:then fileType}
  {#if imageSrc}
    <img src={imageSrc} alt="Bundled file preview for {fileTypePromise}" />
  {:else if fileType}
    <p>File MIME: {fileType.mime}</p>
  {:else}
    <Highlight code={decoder.decode(bundledFile.contents)} language={typescript} />
  {/if}
{/await}
