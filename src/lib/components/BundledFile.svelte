<script lang="ts">
  import type { BundledFile } from "$lib";

  import { fileTypeFromBuffer } from "@sgtpooki/file-type";

  import CodeView from "./CodeView.svelte";
  import { removeBunfsRootFromPath } from "$lib";

  export let bundledFile: BundledFile;
  $: fileTypePromise = fileTypeFromBuffer(bundledFile.contents).then((fileType) => {
    if (fileType?.mime.startsWith("image/")) {
      imageSrc = URL.createObjectURL(new Blob([bundledFile.contents], { type: fileType.mime }));
    }

    return fileType;
  });

  export let removeBunfsRoot = false;

  let imageSrc: string | null = null;

  const decoder = new TextDecoder();
</script>

<h2>
  {#if removeBunfsRoot}
    {removeBunfsRootFromPath(bundledFile.path).slice(1)}
  {:else}
    {bundledFile.path.slice(1)}
  {/if}
</h2>
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
