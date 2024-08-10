<script lang="ts">
  import type { BundledFile } from "$lib";

  import { fileTypeFromBuffer } from "@sgtpooki/file-type";

  import CodeView from "./CodeView.svelte";

  export let bundledFile: BundledFile;
  $: fileTypePromise = fileTypeFromBuffer(bundledFile.contents).then((fileType) => {
    if (fileType?.mime.startsWith("image/")) {
      imageSrc = URL.createObjectURL(new Blob([bundledFile.contents], { type: fileType.mime }));
    }

    return fileType;
  });

  let imageSrc: string | null = null;

  const decoder = new TextDecoder();
</script>

<div>
  <h2 id="file/{bundledFile.path}">{bundledFile.path}</h2>

  {#if bundledFile.sourcemap}
    <h3>Sourcemap</h3>
    <CodeView code={JSON.stringify(bundledFile.sourcemap)} language="json" format />
  {/if}

  {#await fileTypePromise}
    <p>Determining file type</p>
  {:then fileType}
    {#if imageSrc}
      <img src={imageSrc} alt="Bundled file preview for {fileTypePromise}" />
    {:else if fileType}
      <p>File MIME: {fileType.mime}</p>
    {:else}
      <CodeView code={decoder.decode(bundledFile.contents)} />
    {/if}
  {/await}
</div>
